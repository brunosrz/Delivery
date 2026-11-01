import {
  CONSENT_VERSION,
  type ConsentRequest,
  LEGAL_DOCUMENTS,
  LEGAL_VERSIONS,
  type LegalAcceptanceRequest,
  type LegalRecords,
  type SessionUser,
} from "@delivery/contracts"
import { saltedHash } from "./hash.js"

export type PrivacyResult<T> = { ok: true; value: T } | { ok: false; code: "bad_request"; message: string }

type ConsentRow = {
  consent_id: string
  version: number
  analytics: number
  marketing: number
  source: "banner" | "preferences" | "gpc"
  created_at: string
}
type AcceptanceRow = { document: "terms" | "privacy"; version: string; accepted_at: string }

export function createPrivacyService(env: Env) {
  return {
    /**
     * Grava a escolha de cookies. Com Global Privacy Control (`Sec-GPC: 1`) o servidor nunca grava consentimento
     * para analytics ou marketing, mesmo que o corpo diga o contrário: o sinal vale como recusa (CCPA/CPRA).
     */
    async recordConsent(
      input: ConsentRequest,
      context: { userId: string | null; ip: string | null; gpc: boolean },
    ): Promise<PrivacyResult<{ recorded: true }>> {
      if (input.version !== CONSENT_VERSION) {
        return { ok: false, code: "bad_request", message: "versão de consentimento desatualizada" }
      }
      const optedOut = context.gpc
      await env.DB.prepare(
        "insert into consent_records (id, consent_id, user_id, version, analytics, marketing, source, locale, ip_hash) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
        .bind(
          crypto.randomUUID(),
          input.consentId,
          context.userId,
          input.version,
          optedOut ? 0 : Number(input.analytics),
          optedOut ? 0 : Number(input.marketing),
          optedOut ? "gpc" : input.source,
          input.locale,
          context.ip ? await saltedHash(env, "consent-ip", context.ip) : null,
        )
        .run()
      return { ok: true, value: { recorded: true } }
    },

    /** Registra o aceite de cada documento. Só aceita a versão vigente; repetir o mesmo aceite é inofensivo. */
    async recordAcceptance(
      user: SessionUser,
      input: LegalAcceptanceRequest,
      ip: string | null,
    ): Promise<PrivacyResult<{ accepted: true }>> {
      for (const document of LEGAL_DOCUMENTS) {
        if (input[document] !== LEGAL_VERSIONS[document]) {
          return { ok: false, code: "bad_request", message: `versão desatualizada: ${document}` }
        }
      }
      const ipHash = ip ? await saltedHash(env, "acceptance-ip", ip) : null
      await env.DB.batch(
        LEGAL_DOCUMENTS.map((document) =>
          env.DB.prepare(
            "insert or ignore into legal_acceptances (id, user_id, document, version, ip_hash) values (?, ?, ?, ?, ?)",
          ).bind(crypto.randomUUID(), user.id, document, LEGAL_VERSIONS[document], ipHash),
        ),
      )
      return { ok: true, value: { accepted: true } }
    },

    /** Aceites e consentimentos ligados ao usuário, para a exportação de dados. */
    async recordsOf(userId: string): Promise<LegalRecords> {
      const [acceptances, consents] = await Promise.all([
        env.DB.prepare(
          "select document, version, accepted_at from legal_acceptances where user_id = ? order by accepted_at",
        )
          .bind(userId)
          .all<AcceptanceRow>(),
        env.DB.prepare(
          "select consent_id, version, analytics, marketing, source, created_at from consent_records where user_id = ? order by created_at",
        )
          .bind(userId)
          .all<ConsentRow>(),
      ])
      return {
        acceptances: acceptances.results.map((row) => ({
          document: row.document,
          version: row.version,
          acceptedAt: new Date(row.accepted_at).toISOString(),
        })),
        consents: consents.results.map((row) => ({
          consentId: row.consent_id,
          version: row.version,
          analytics: row.analytics === 1,
          marketing: row.marketing === 1,
          source: row.source,
          recordedAt: new Date(row.created_at).toISOString(),
        })),
      }
    },

    /** Registro de atendimento ao titular. O titular aparece só como hash. */
    async logRequest(userId: string, type: "export" | "delete", status: "completed" | "refused", reason?: string) {
      await env.DB.prepare("insert into data_requests (id, subject_hash, type, status, reason) values (?, ?, ?, ?, ?)")
        .bind(crypto.randomUUID(), await saltedHash(env, "subject", userId), type, status, reason ?? null)
        .run()
    },
  }
}
