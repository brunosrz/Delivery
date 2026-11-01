/**
 * Prazos de retenção (princípio da limitação do armazenamento: LGPD art. 6º, III e art. 15-16; GDPR art. 5(1)(e)).
 * Mudou um prazo aqui: atualize a Política de Privacidade (apps/web/lib/legal) e docs/privacidade-e-seguranca.md.
 */
export const RETENTION_DAYS = {
  /** Mensagens do formulário de contato: tempo de atender e responder. */
  contactMessages: 365,
  /** Prova do consentimento de cookies e atendimento a solicitações: prazo prescricional razoável. */
  consentRecords: 5 * 365,
  dataRequests: 5 * 365,
} as const

const DAY_MS = 24 * 60 * 60 * 1000

export type RetentionResult = {
  contactMessages: number
  consentRecords: number
  dataRequests: number
  sessions: number
  verifications: number
}

/** Apaga o que passou do prazo. Roda no cron; cada exclusão é independente e idempotente. */
export async function purgeExpired(env: Env, now = Date.now()): Promise<RetentionResult> {
  const before = (days: number) => new Date(now - days * DAY_MS).toISOString()
  const run = async (sql: string, ...binds: unknown[]) =>
    (
      await env.DB.prepare(sql)
        .bind(...binds)
        .run()
    ).meta.changes

  return {
    contactMessages: await run(
      "delete from contact_messages where created_at < ?",
      before(RETENTION_DAYS.contactMessages),
    ),
    consentRecords: await run(
      "delete from consent_records where created_at < ?",
      before(RETENTION_DAYS.consentRecords),
    ),
    dataRequests: await run("delete from data_requests where created_at < ?", before(RETENTION_DAYS.dataRequests)),
    // Sessões e verificações guardam o tempo em milissegundos desde a época.
    sessions: await run("delete from session where expires_at < ?", now),
    verifications: await run("delete from verification where expires_at < ?", now),
  }
}
