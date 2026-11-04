import { API_VERSION, type ApiError, type ErrorCode, type SessionUser } from "@delivery/contracts"
import type { Context, MiddlewareHandler } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { pathWithoutQuery, redact } from "./redact.js"

export type AppEnv = {
  Bindings: Env
  Variables: { requestId: string; user: SessionUser | null }
}

const STATUS_BY_CODE = {
  bad_request: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  idempotency_mismatch: 422,
  invalid_transition: 409,
  unavailable: 503,
  rate_limited: 429,
  internal: 500,
} as const satisfies Record<ErrorCode, ContentfulStatusCode>

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/

/** Propaga um X-Request-Id válido recebido ou gera um novo, e devolve no header da resposta. */
export const requestId: MiddlewareHandler<AppEnv> = async (c, next) => {
  const incoming = c.req.header("x-request-id")
  const id = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : crypto.randomUUID()
  c.set("requestId", id)
  await next()
  // Respostas 101 (upgrade para WebSocket) têm headers imutáveis: não recebem x-request-id.
  if (c.res.status !== 101) c.header("x-request-id", id)
}

function meta(c: Context<AppEnv>) {
  return { requestId: c.get("requestId"), apiVersion: API_VERSION }
}

export function ok<T>(c: Context<AppEnv>, data: T) {
  return c.json({ data, error: null, meta: meta(c) }, 200)
}

export function created<T>(c: Context<AppEnv>, data: T) {
  return c.json({ data, error: null, meta: meta(c) }, 201)
}

export function fail<C extends ErrorCode>(c: Context<AppEnv>, code: C, message: string, fields?: ApiError["fields"]) {
  const error: ApiError = fields ? { code, message, fields } : { code, message }
  return c.json({ data: null, error, meta: meta(c) }, STATUS_BY_CODE[code] as (typeof STATUS_BY_CODE)[C])
}

/** Log estruturado sem payload de requisição: nunca registra corpo, headers de autenticação ou cookies. */
export function logError(c: Context<AppEnv>, event: string, error: unknown) {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      requestId: c.get("requestId"),
      path: pathWithoutQuery(c.req.path),
      message: redact(error instanceof Error ? error.message : String(error)),
    }),
  )
}

/**
 * Log de acesso: id, método, caminho sem query, status e duração. Nunca registra headers, cookies, corpo ou query
 * (que pode trazer ticket de tempo real).
 */
export const accessLog: MiddlewareHandler<AppEnv> = async (c, next) => {
  const started = Date.now()
  await next()
  console.log(
    JSON.stringify({
      level: "info",
      event: "request",
      requestId: c.get("requestId"),
      method: c.req.method,
      path: pathWithoutQuery(c.req.path),
      status: c.res.status,
      durationMs: Date.now() - started,
    }),
  )
}

/** Respostas da API são JSON: nada de embutir em frame, nada de adivinhar tipo, nada de enviar referer. */
const API_SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "strict-transport-security": "max-age=63072000; includeSubDomains",
  "cross-origin-opener-policy": "same-origin",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
} as const

/** Rotas com dado pessoal ou de sessão: nunca ficam em cache de navegador, proxy ou CDN. */
const PRIVATE_PREFIXES = [
  "/v1/me",
  "/v1/orders",
  "/v1/manage",
  "/v1/admin",
  "/v1/courier",
  "/v1/live",
  "/v1/consents",
  "/v1/legal",
  "/api/auth",
]

export const isPrivatePath = (path: string) =>
  PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))

export const securityHeaders: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next()
  // Respostas 101 (upgrade para WebSocket) têm headers imutáveis.
  if (c.res.status === 101) return
  for (const [name, value] of Object.entries(API_SECURITY_HEADERS)) c.res.headers.set(name, value)
  if (isPrivatePath(c.req.path)) {
    c.res.headers.set("cache-control", "no-store")
    c.res.headers.set("pragma", "no-cache")
  }
}
