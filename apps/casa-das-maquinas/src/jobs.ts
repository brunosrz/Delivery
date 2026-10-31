import type { LiveEvent } from "./restaurant-room.js"
import { redact } from "./redact.js"

/** Tentativas antes de marcar o job como `dead` (precisa de olhar humano). */
export const MAX_ATTEMPTS = 5
/** Idade mínima para o cron reenviar: dá tempo da publicação imediata terminar e marcar `done`. */
export const MIN_AGE_MS = 30_000
const BATCH = 25

type JobRow = { id: string; restaurant_id: string; order_id: string; payload: string; attempts: number }

/** A publicação imediata deu certo: encerra os jobs pendentes do pedido que ela cobre (eventos até `at`). */
export async function markPublished(env: Env, orderId: string, at: string): Promise<void> {
  await env.DB.prepare(
    "update outbox_jobs set status = 'done', updated_at = ? where order_id = ? and status = 'pending' and json_extract(payload, '$.at') <= ?",
  )
    .bind(new Date().toISOString(), orderId, at)
    .run()
}

export type OutboxResult = { published: number; failed: number; dead: number }

/**
 * Reenvia jobs que ficaram pendentes (publicação imediata falhou ou o Worker caiu depois do commit).
 * Falha vira nova tentativa; depois de MAX_ATTEMPTS o job fica `dead`, com o motivo, para análise.
 */
export async function runOutbox(
  env: Env,
  options: { minAgeMs?: number; now?: Date; log?: (line: string) => void } = {},
): Promise<OutboxResult> {
  const now = options.now ?? new Date()
  const cutoff = new Date(now.getTime() - (options.minAgeMs ?? MIN_AGE_MS)).toISOString()
  const log = options.log ?? ((line: string) => console.log(line))
  const { results } = await env.DB.prepare(
    "select id, restaurant_id, order_id, payload, attempts from outbox_jobs where status = 'pending' and created_at <= ? order by created_at limit ?",
  )
    .bind(cutoff, BATCH)
    .all<JobRow>()

  const outcome: OutboxResult = { published: 0, failed: 0, dead: 0 }
  for (const job of results) {
    try {
      const event = JSON.parse(job.payload) as Omit<LiveEvent, "seq">
      await env.RESTAURANT_ROOM.getByName(job.restaurant_id).publish(event)
      await env.DB.prepare("update outbox_jobs set status = 'done', updated_at = ? where id = ?")
        .bind(now.toISOString(), job.id)
        .run()
      outcome.published += 1
    } catch (error) {
      const attempts = job.attempts + 1
      const dead = attempts >= MAX_ATTEMPTS
      await env.DB.prepare(
        "update outbox_jobs set attempts = ?, status = ?, last_error = ?, updated_at = ? where id = ?",
      )
        .bind(attempts, dead ? "dead" : "pending", redact(String(error)).slice(0, 300), now.toISOString(), job.id)
        .run()
      if (dead) outcome.dead += 1
      else outcome.failed += 1
      log(
        JSON.stringify({
          level: "error",
          event: dead ? "outbox_job_dead" : "outbox_job_retry",
          jobId: job.id,
          orderId: job.order_id,
          attempts,
        }),
      )
    }
  }
  return outcome
}
