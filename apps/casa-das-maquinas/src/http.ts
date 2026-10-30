import { API_VERSION, type ApiError, type ErrorCode, type SessionUser } from "@delivery/contracts"
import type { Context, MiddlewareHandler } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"

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
  c.header("x-request-id", id)
}

function meta(c: Context<AppEnv>) {
  return { requestId: c.get("requestId"), apiVersion: API_VERSION }
}

export function ok<T>(c: Context<AppEnv>, data: T) {
  return c.json({ data, error: null, meta: meta(c) }, 200)
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
      path: c.req.path,
      message: error instanceof Error ? error.message : String(error),
    }),
  )
}
