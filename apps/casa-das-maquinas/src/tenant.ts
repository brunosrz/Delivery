import type { ErrorCode, SessionUser } from "@delivery/contracts"
import { createMiddleware } from "hono/factory"
import { fail, type AppEnv } from "./http.js"

/**
 * Exclusão recuperável de restaurante (tenant). Fluxo:
 *  1. `suspend` (só administração): esconde do catálogo, bloqueia pedidos novos e a equipe, cancela jobs pendentes.
 *  2. Por 30 dias, `restore` desfaz tudo (menos os jobs da caixa de saída já cancelados).
 *  3. Passado o prazo, o cron remove os dados do restaurante (cardápio, MKit, vínculos da equipe) e limpa o objeto
 *     durável. Os pedidos ficam, por obrigação fiscal e financeira, e a linha do restaurante vira um marcador.
 */
export const TENANT_GRACE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

export type TenantResult<T> = { ok: true; value: T } | { ok: false; code: ErrorCode; message: string }
export type TenantStatus = { restaurantId: string; deletedAt: string; purgeAfter: string }

type Row = { id: string; deleted_at: string | null; purged_at: string | null }

const purgeAfter = (deletedAt: string) => new Date(Date.parse(deletedAt) + TENANT_GRACE_DAYS * DAY_MS).toISOString()

/** O restaurante está suspenso (ou já foi removido)? Restaurante que não existe vale como não suspenso. */
export async function isTenantSuspended(env: Env, restaurantId: string): Promise<boolean> {
  const row = await env.DB.prepare("select deleted_at from restaurants where id = ?")
    .bind(restaurantId)
    .first<{ deleted_at: string | null }>()
  return row?.deleted_at != null
}

/**
 * Nas rotas de gestão de um restaurante suspenso, só a administração entra (para poder restaurar). A equipe do
 * restaurante recebe 403 mesmo com o vínculo intacto.
 */
export const tenantActive = createMiddleware<AppEnv>(async (c, next) => {
  const restaurantId = c.req.param("restaurantId")
  const user = c.get("user")
  if (restaurantId && user && user.role !== "admin" && (await isTenantSuspended(c.env, restaurantId))) {
    return fail(c, "forbidden", "restaurante indisponível")
  }
  await next()
})

export function createTenantService(env: Env) {
  async function load(id: string): Promise<Row | null> {
    return env.DB.prepare("select id, deleted_at, purged_at from restaurants where id = ?").bind(id).first<Row>()
  }

  return {
    async suspend(user: SessionUser, restaurantId: string): Promise<TenantResult<TenantStatus>> {
      if (user.role !== "admin")
        return { ok: false, code: "forbidden", message: "só a administração pode excluir restaurantes" }
      const row = await load(restaurantId)
      if (!row) return { ok: false, code: "not_found", message: "restaurante não encontrado" }
      if (row.deleted_at) return { ok: false, code: "conflict", message: "restaurante já está excluído" }

      const now = new Date().toISOString()
      // Um lote só: ou o restaurante é suspenso e os jobs cancelados, ou nada muda.
      await env.DB.batch([
        env.DB.prepare(
          "update restaurants set deleted_at = ?, updated_at = ? where id = ? and deleted_at is null",
        ).bind(now, now, restaurantId),
        env.DB.prepare(
          "update outbox_jobs set status = 'dead', last_error = 'restaurante excluído', updated_at = ? where restaurant_id = ? and status = 'pending'",
        ).bind(now, restaurantId),
      ])
      return { ok: true, value: { restaurantId, deletedAt: now, purgeAfter: purgeAfter(now) } }
    },

    async restore(user: SessionUser, restaurantId: string): Promise<TenantResult<{ restaurantId: string }>> {
      if (user.role !== "admin")
        return { ok: false, code: "forbidden", message: "só a administração pode restaurar restaurantes" }
      const row = await load(restaurantId)
      if (!row) return { ok: false, code: "not_found", message: "restaurante não encontrado" }
      if (row.purged_at)
        return { ok: false, code: "conflict", message: "os dados deste restaurante já foram removidos" }
      if (!row.deleted_at) return { ok: false, code: "conflict", message: "restaurante não está excluído" }
      await env.DB.prepare("update restaurants set deleted_at = null, updated_at = ? where id = ?")
        .bind(new Date().toISOString(), restaurantId)
        .run()
      return { ok: true, value: { restaurantId } }
    },
  }
}

/**
 * Remove de vez os restaurantes suspensos há mais de 30 dias. Cada etapa pode ser repetida: se o objeto durável falhar,
 * `purged_at` não é gravado e o próximo ciclo do cron tenta de novo. Devolve quantos restaurantes foram removidos.
 */
export async function purgeSuspendedTenants(env: Env, now = Date.now()): Promise<number> {
  const cutoff = new Date(now - TENANT_GRACE_DAYS * DAY_MS).toISOString()
  const { results } = await env.DB.prepare(
    "select id from restaurants where deleted_at is not null and deleted_at < ? and purged_at is null limit 10",
  )
    .bind(cutoff)
    .all<{ id: string }>()

  let purged = 0
  for (const { id } of results) {
    try {
      await env.RESTAURANT_ROOM.getByName(id).destroy()
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "tenant_purge_room_failed",
          restaurantId: id,
          message: String(error).slice(0, 200),
        }),
      )
      continue
    }
    await env.DB.batch([
      // Cardápio: as seções levam produtos, grupos e opções em cascata.
      env.DB.prepare("delete from menu_sections where restaurant_id = ?").bind(id),
      env.DB.prepare("delete from opening_hours where restaurant_id = ?").bind(id),
      env.DB.prepare("delete from mkit_materials where restaurant_id = ?").bind(id),
      env.DB.prepare("delete from mkit_calendar_events where restaurant_id = ?").bind(id),
      env.DB.prepare("delete from mkit_categories where restaurant_id = ?").bind(id),
      env.DB.prepare("delete from restaurant_members where restaurant_id = ?").bind(id),
      env.DB.prepare("update restaurants set purged_at = ?, updated_at = ? where id = ?").bind(
        new Date(now).toISOString(),
        new Date(now).toISOString(),
        id,
      ),
    ])
    purged += 1
  }
  return purged
}
