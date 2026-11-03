import type { MiddlewareHandler } from "hono"
import { fail, logError, type AppEnv } from "./http.js"

export type RateLimitRule = {
  /** Nome do grupo de rotas: cada grupo tem o seu contador. */
  scope: string
  /** Requisições permitidas por janela. */
  limit: number
  /** Duração da janela fixa, em segundos. */
  windowSeconds: number
}

/** Janelas mais velhas que isso já não contam para ninguém e podem ser apagadas. */
const RETENTION_SECONDS = 24 * 60 * 60

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

/**
 * Limite por janela fixa, contado no D1 com um único `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`: o contador
 * sobe de forma atômica mesmo com requisições simultâneas. A identidade é o usuário da sessão ou, sem sessão, o IP
 * (hash salgado: o IP nunca é gravado). Sem identidade nenhuma (desenvolvimento local), não limita. Se o D1 falhar,
 * a requisição passa: o limite protege a API, não pode derrubá-la.
 */
export function rateLimit(rule: RateLimitRule): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const user = c.get("user")
    const ip = c.req.header("cf-connecting-ip")
    const identity = user ? `u:${user.id}` : ip ? `ip:${ip}` : null
    if (!identity) return next()

    const nowSeconds = Math.floor(Date.now() / 1000)
    const windowStart = nowSeconds - (nowSeconds % rule.windowSeconds)
    try {
      const key = await sha256(`${c.env.BETTER_AUTH_SECRET}:${rule.scope}:${identity}`)
      const row = await c.env.DB.prepare(
        "insert into rate_limit_buckets (key, window_start, count) values (?, ?, 1) " +
          "on conflict (key, window_start) do update set count = count + 1 returning count",
      )
        .bind(key, windowStart)
        .first<{ count: number }>()
      const configuredLimit = rule.scope === "auth" ? Number(c.env.AUTH_RATE_LIMIT ?? rule.limit) : rule.limit
      const limit = Number.isSafeInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : rule.limit
      if (row && row.count > limit) {
        const retryAfter = Math.max(1, windowStart + rule.windowSeconds - nowSeconds)
        c.header("retry-after", String(retryAfter))
        return fail(c, "rate_limited", "muitas requisições; tente de novo em instantes")
      }
    } catch (error) {
      logError(c, "rate_limit_unavailable", error)
    }
    return next()
  }
}

/** Remove janelas antigas; roda no cron. */
export async function pruneRateLimits(env: Env, now = Date.now()): Promise<number> {
  const cutoff = Math.floor(now / 1000) - RETENTION_SECONDS
  const result = await env.DB.prepare("delete from rate_limit_buckets where window_start < ?").bind(cutoff).run()
  return result.meta.changes
}
