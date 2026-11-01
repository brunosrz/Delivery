import type { AccountExport, ErrorCode, SessionUser } from "@delivery/contracts"
import { createOrdersService } from "./orders.js"

export type AccountResult<T> = { ok: true; value: T } | { ok: false; code: ErrorCode; message: string }

/** Pedidos nesses estados já terminaram; os demais ainda dependem do vínculo com o cliente. */
const FINAL_STATUSES = ["delivered", "cancelled"] as const

type UserRow = { id: string; email: string; name: string; role: AccountExport["user"]["role"]; created_at: number }

export function createAccountService(env: Env) {
  return {
    async export(user: SessionUser): Promise<AccountResult<AccountExport>> {
      const row = await env.DB.prepare("select id, email, name, role, created_at from user where id = ?")
        .bind(user.id)
        .first<UserRow>()
      if (!row) return { ok: false, code: "not_found", message: "conta não encontrada" }
      const profile = await env.DB.prepare("select 1 as ok from asaas_customers where user_id = ?")
        .bind(user.id)
        .first()
      return {
        ok: true,
        value: {
          exportedAt: new Date().toISOString(),
          user: {
            id: row.id,
            email: row.email,
            name: row.name,
            role: row.role,
            createdAt: new Date(row.created_at).toISOString(),
          },
          orders: await createOrdersService(env).listForCustomer(user),
          hasPaymentProfile: profile !== null,
        },
      }
    },

    /**
     * Anonimiza a conta do cliente. Os pedidos ficam (obrigação fiscal e financeira, art. 16 da LGPD), sem endereço e
     * sem vínculo com dados pessoais; credenciais, sessões e cadastro de cobrança são apagados.
     */
    async delete(user: SessionUser): Promise<AccountResult<{ deleted: true }>> {
      if (user.role !== "customer") {
        return { ok: false, code: "forbidden", message: "só contas de cliente podem ser excluídas por aqui" }
      }
      const open = await env.DB.prepare(
        `select count(*) as n from orders where customer_id = ? and status not in (${FINAL_STATUSES.map(() => "?").join(", ")})`,
      )
        .bind(user.id, ...FINAL_STATUSES)
        .first<{ n: number }>()
      if ((open?.n ?? 0) > 0) {
        return { ok: false, code: "conflict", message: "há pedidos em andamento; conclua ou cancele antes de excluir" }
      }

      const row = await env.DB.prepare("select email from user where id = ?").bind(user.id).first<{ email: string }>()
      if (!row) return { ok: false, code: "not_found", message: "conta não encontrada" }

      // Um único lote: ou a conta inteira é anonimizada, ou nada muda.
      await env.DB.batch([
        env.DB.prepare("update orders set address_json = null where customer_id = ?").bind(user.id),
        env.DB.prepare("delete from asaas_customers where user_id = ?").bind(user.id),
        env.DB.prepare("delete from verification where identifier = ?").bind(row.email),
        env.DB.prepare("delete from session where user_id = ?").bind(user.id),
        env.DB.prepare("delete from account where user_id = ?").bind(user.id),
        env.DB.prepare(
          "update user set name = 'Conta excluída', email = ?, image = null, email_verified = 0, updated_at = ? where id = ?",
        ).bind(`excluido-${user.id}@invalid.local`, Date.now(), user.id),
      ])
      return { ok: true, value: { deleted: true } }
    },
  }
}
