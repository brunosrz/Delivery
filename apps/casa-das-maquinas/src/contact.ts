import type { ContactRequest, ErrorCode } from "@delivery/contracts"

/** Mensagens por IP (hash) por hora. Acima disso o formulário responde 429. */
export const CONTACT_LIMIT_PER_HOUR = 5
const HOUR_MS = 60 * 60 * 1000

export type ContactResult = { ok: true } | { ok: false; code: ErrorCode; message: string }

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

/** Verifica o desafio no Turnstile (https://developers.cloudflare.com/turnstile/). Só roda quando há segredo configurado. */
async function turnstileOk(secret: string, token: string | undefined, ip: string): Promise<boolean> {
  if (!token) return false
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    })
    const body = (await response.json()) as { success?: boolean }
    return body.success === true
  } catch {
    return false
  }
}

/**
 * Registra a mensagem de contato. Robôs que preenchem a armadilha `website` recebem sucesso e nada é gravado
 * (não ensinamos o robô a se adaptar). O IP vira um hash salgado com o segredo do app e nunca é gravado.
 */
export async function receiveContact(
  env: Env,
  input: ContactRequest,
  ip: string,
  now = new Date(),
): Promise<ContactResult> {
  if (input.website) return { ok: true }

  if (env.TURNSTILE_SECRET && !(await turnstileOk(env.TURNSTILE_SECRET, input.turnstileToken, ip))) {
    return { ok: false, code: "bad_request", message: "não foi possível validar o desafio anti-robô" }
  }

  const ipHash = await sha256(`${env.BETTER_AUTH_SECRET}:${ip}`)
  const since = new Date(now.getTime() - HOUR_MS).toISOString()
  const recent = await env.DB.prepare(
    "select count(*) as n from contact_messages where ip_hash = ? and created_at >= ?",
  )
    .bind(ipHash, since)
    .first<{ n: number }>()
  if ((recent?.n ?? 0) >= CONTACT_LIMIT_PER_HOUR) {
    return { ok: false, code: "rate_limited", message: "muitas mensagens; tente de novo mais tarde" }
  }

  await env.DB.prepare(
    "insert into contact_messages (id, name, email, message, ip_hash, created_at) values (?, ?, ?, ?, ?, ?)",
  )
    .bind(crypto.randomUUID(), input.name, input.email, input.message, ipHash, now.toISOString())
    .run()
  return { ok: true }
}
