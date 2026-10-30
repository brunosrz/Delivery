// Ticket curto para abrir o WebSocket de tempo real. O navegador não envia o
// cookie do site para o domínio do Worker, então o app web pede o ticket no
// servidor (com a sessão) e o entrega ao cliente. O ticket só vale para um
// restaurante ou um pedido e expira em segundos.

export type LiveScope =
  { scope: "restaurant"; restaurantId: string } | { scope: "order"; restaurantId: string; orderId: string }

export type LiveTicket = LiveScope & { sub: string; exp: number }

export const TICKET_TTL_SECONDS = 60

const encoder = new TextEncoder()

function base64url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4)
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
}

async function hmacKey(secret: string) {
  // Chave derivada com rótulo próprio: o ticket não reaproveita a assinatura da sessão.
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(`live-ticket:v1:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

export async function signTicket(secret: string, ticket: Omit<LiveTicket, "exp">, now = Date.now()): Promise<string> {
  const payload = base64url(
    encoder.encode(JSON.stringify({ ...ticket, exp: Math.floor(now / 1000) + TICKET_TTL_SECONDS })),
  )
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload))
  return `${payload}.${base64url(new Uint8Array(signature))}`
}

/** Verifica assinatura (comparação em tempo constante via subtle.verify) e validade. */
export async function verifyTicket(secret: string, token: string, now = Date.now()): Promise<LiveTicket | null> {
  const [payload, signature, extra] = token.split(".")
  if (!payload || !signature || extra !== undefined) return null
  let valid = false
  try {
    valid = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromBase64url(signature), encoder.encode(payload))
  } catch {
    return null
  }
  if (!valid) return null

  let ticket: LiveTicket
  try {
    ticket = JSON.parse(new TextDecoder().decode(fromBase64url(payload))) as LiveTicket
  } catch {
    return null
  }
  if (typeof ticket.exp !== "number" || ticket.exp * 1000 <= now) return null
  return ticket
}
