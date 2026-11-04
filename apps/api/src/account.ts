import type { AccountExport, ErrorCode, SessionUser } from "@delivery/contracts"
import { createOrdersService } from "./orders.js"
import { createPrivacyService } from "./privacy.js"

export type AccountResult<T> = { ok: true; value: T } | { ok: false; code: ErrorCode; message: string }

/**
 * Endereço no lugar do original nos pedidos de entrega anonimizados: o schema `Order` exige endereço em entrega, então
 * a fila do restaurante continua válida sem expor o endereço real.
 */
export const ANONYMIZED_ADDRESS = {
  street: "Endereço removido",
  number: "0",
  district: "-",
  city: "-",
  state: "--",
  postalCode: "00000-000",
} as const

/**
 * A exclusão exige sessão recente: quem roubou um cookie antigo não consegue apagar a conta sem a senha. Passou desse
 * tempo, o titular entra de novo (a resposta é 401 e o app leva ao login).
 */
export const FRESH_SESSION_MS = 15 * 60 * 1000

/** Pedidos nesses estados já terminaram; os demais ainda dependem do vínculo com o cliente. */
const FINAL_STATUSES = ["delivered", "cancelled"] as const

type UserRow = { id: string; email: string; name: string; role: AccountExport["user"]["role"]; created_at: number }

export function createAccountService(env: Env) {
  const privacy = createPrivacyService(env)
  return {
    async export(user: SessionUser): Promise<AccountResult<AccountExport>> {
      const row = await env.DB.prepare("select id, email, name, role, created_at from user where id = ?")
        .bind(user.id)
        .first<UserRow>()
      if (!row) return { ok: false, code: "not_found", message: "conta não encontrada" }
      const profile = await env.DB.prepare("select 1 as ok from asaas_customers where user_id = ?")
        .bind(user.id)
        .first()
      const [orders, legal] = await Promise.all([
        createOrdersService(env).listAllForCustomer(user),
        privacy.recordsOf(user.id),
      ])
      await privacy.logRequest(user.id, "export", "completed")
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
          orders,
          hasPaymentProfile: profile !== null,
          legal,
        },
      }
    },

    /**
     * Anonimiza a conta do cliente. Os pedidos ficam (obrigação fiscal e financeira, art. 16 da LGPD), sem endereço e
     * sem vínculo com dados pessoais; credenciais, sessões e o vínculo local com o cadastro de cobrança são apagados.
     * O cadastro remoto no Asaas fica retido (obrigação fiscal e financeira): ver o README.
     */
    async delete(user: SessionUser, session: { createdAt: Date }): Promise<AccountResult<{ deleted: true }>> {
      const refuse = async (code: ErrorCode, message: string): Promise<AccountResult<never>> => {
        await privacy.logRequest(user.id, "delete", "refused", message)
        return { ok: false, code, message }
      }
      if (user.role !== "customer") return refuse("forbidden", "só contas de cliente podem ser excluídas por aqui")
      if (Date.now() - session.createdAt.getTime() > FRESH_SESSION_MS) {
        return refuse("unauthenticated", "por segurança, entre novamente antes de excluir a conta")
      }
      const open = await env.DB.prepare(
        `select count(*) as n from orders where customer_id = ? and status not in (${FINAL_STATUSES.map(() => "?").join(", ")})`,
      )
        .bind(user.id, ...FINAL_STATUSES)
        .first<{ n: number }>()
      if ((open?.n ?? 0) > 0) {
        return refuse("conflict", "há pedidos em andamento; conclua ou cancele antes de excluir")
      }

      const row = await env.DB.prepare("select email from user where id = ?").bind(user.id).first<{ email: string }>()
      if (!row) return { ok: false, code: "not_found", message: "conta não encontrada" }

      // Um único lote: ou a conta inteira é anonimizada, ou nada muda.
      await env.DB.batch([
        env.DB.prepare("update orders set address_json = ? where customer_id = ? and fulfillment = 'delivery'").bind(
          JSON.stringify(ANONYMIZED_ADDRESS),
          user.id,
        ),
        env.DB.prepare("update orders set address_json = null where customer_id = ? and fulfillment = 'pickup'").bind(
          user.id,
        ),
        env.DB.prepare("delete from asaas_customers where user_id = ?").bind(user.id),
        // Verificação por e-mail (identifier) e tokens de redefinição de senha, que guardam o id do usuário (value).
        env.DB.prepare("delete from verification where identifier = ? or value = ?").bind(row.email, user.id),
        env.DB.prepare("delete from session where user_id = ?").bind(user.id),
        env.DB.prepare("delete from account where user_id = ?").bind(user.id),
        // Mensagens de contato guardam o e-mail sem vínculo com a conta; saem junto. Aceites perdem o sentido sem o titular.
        env.DB.prepare("delete from contact_messages where lower(email) = lower(?)").bind(row.email),
        env.DB.prepare("delete from legal_acceptances where user_id = ?").bind(user.id),
        // O consentimento de cookies fica como prova, mas deixa de apontar para a pessoa.
        env.DB.prepare("update consent_records set user_id = null where user_id = ?").bind(user.id),
        env.DB.prepare(
          "update user set name = 'Conta excluída', email = ?, image = null, email_verified = 0, updated_at = ? where id = ?",
        ).bind(`excluido-${user.id}@invalid.local`, Date.now(), user.id),
      ])
      await privacy.logRequest(user.id, "delete", "completed")
      return { ok: true, value: { deleted: true } }
    },
  }
}
