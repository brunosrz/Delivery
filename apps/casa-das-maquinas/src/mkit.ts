import type { CreateMkitMaterial, MkitMaterial, SessionUser, UpdateMkitMaterial } from "@delivery/contracts"
import { sanitizeText } from "@delivery/domain"
import { and, desc, eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"
import { canManageRestaurant } from "./auth.js"
import * as schema from "./db/orders-schema.js"

type Row = typeof schema.mkitMaterials.$inferSelect

/** Limite por restaurante, para um painel comprometido não encher o banco. */
export const MAX_MATERIALS_PER_RESTAURANT = 200

export type MkitResult<T> =
  { ok: true; value: T } | { ok: false; code: "forbidden" | "not_found" | "conflict"; message: string }

const toMaterial = (row: Row): MkitMaterial => ({
  id: row.id,
  restaurantId: row.restaurantId,
  title: row.title,
  kind: row.kind,
  body: row.body,
  status: row.status,
  exportCount: row.exportCount,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})

const forbidden = { ok: false, code: "forbidden", message: "sem acesso a este restaurante" } as const
const notFound = { ok: false, code: "not_found", message: "material não encontrado" } as const

export function createMkitService(env: Env) {
  const db = drizzle(env.DB, { schema })
  const t = schema.mkitMaterials

  async function find(restaurantId: string, id: string): Promise<Row | undefined> {
    const [row] = await db
      .select()
      .from(t)
      .where(and(eq(t.id, id), eq(t.restaurantId, restaurantId)))
      .limit(1)
    return row
  }

  return {
    async list(user: SessionUser, restaurantId: string): Promise<MkitResult<MkitMaterial[]>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      const rows = await db
        .select()
        .from(t)
        .where(eq(t.restaurantId, restaurantId))
        .orderBy(desc(t.updatedAt))
        .limit(MAX_MATERIALS_PER_RESTAURANT)
      return { ok: true, value: rows.map(toMaterial) }
    },

    async create(
      user: SessionUser,
      restaurantId: string,
      input: CreateMkitMaterial,
    ): Promise<MkitResult<MkitMaterial>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      const [{ total } = { total: 0 }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(t)
        .where(eq(t.restaurantId, restaurantId))
      if (total >= MAX_MATERIALS_PER_RESTAURANT) {
        return { ok: false, code: "conflict", message: "limite de materiais do restaurante atingido" }
      }
      const id = crypto.randomUUID()
      // Nova limpeza no servidor: não confiamos que o chamador passou pelo schema do cliente.
      await db.insert(t).values({
        id,
        restaurantId,
        title: sanitizeText(input.title),
        kind: input.kind,
        body: sanitizeText(input.body),
      })
      const created = await find(restaurantId, id)
      return created ? { ok: true, value: toMaterial(created) } : notFound
    },

    async update(
      user: SessionUser,
      restaurantId: string,
      id: string,
      input: UpdateMkitMaterial,
    ): Promise<MkitResult<MkitMaterial>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      if (!(await find(restaurantId, id))) return notFound
      await db
        .update(t)
        .set({
          ...(input.title !== undefined ? { title: sanitizeText(input.title) } : {}),
          ...(input.kind !== undefined ? { kind: input.kind } : {}),
          ...(input.body !== undefined ? { body: sanitizeText(input.body) } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(t.id, id), eq(t.restaurantId, restaurantId)))
      const updated = await find(restaurantId, id)
      return updated ? { ok: true, value: toMaterial(updated) } : notFound
    },

    async remove(user: SessionUser, restaurantId: string, id: string): Promise<MkitResult<true>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      if (!(await find(restaurantId, id))) return notFound
      await db.delete(t).where(and(eq(t.id, id), eq(t.restaurantId, restaurantId)))
      return { ok: true, value: true }
    },

    /** Texto pronto para copiar ou baixar, e a métrica de uso (cada exportação soma 1). */
    async exportText(
      user: SessionUser,
      restaurantId: string,
      id: string,
    ): Promise<MkitResult<{ filename: string; text: string }>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      const row = await find(restaurantId, id)
      if (!row) return notFound
      await db
        .update(t)
        .set({ exportCount: sql`${t.exportCount} + 1` })
        .where(eq(t.id, id))
      const slug =
        row.title
          .normalize("NFD")
          .replace(/[^\w\s-]/g, "")
          .trim()
          .toLowerCase()
          .replace(/[\s_]+/g, "-")
          .slice(0, 60) || "material"
      return { ok: true, value: { filename: `${slug}.txt`, text: `${row.title}\n\n${row.body}\n` } }
    },
  }
}
