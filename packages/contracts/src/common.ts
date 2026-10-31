import { z } from "zod"

export const API_VERSION = "v1" as const

/** Valor monetário em centavos inteiros. Nunca float. */
export const Cents = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

export const Id = z.string().min(1).max(64)

/** Identificador público usado em URLs (letras minúsculas, números e hífen). */
export const Slug = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug inválido")

export const Timestamp = z.iso.datetime({ offset: true })

/** Chave enviada no header Idempotency-Key em toda criação de pedido e transição de status. */
export const IdempotencyKey = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/, "idempotency key inválida")

export const ErrorCode = z.enum([
  "bad_request",
  "unauthenticated",
  "forbidden",
  "not_found",
  "conflict",
  "idempotency_mismatch",
  "invalid_transition",
  "unavailable",
  "rate_limited",
  "internal",
])
export type ErrorCode = z.infer<typeof ErrorCode>

export const ApiError = z.object({
  code: ErrorCode,
  message: z.string(),
  /** Caminhos dos campos inválidos, quando o erro vem de validação. */
  fields: z.record(z.string(), z.array(z.string())).optional(),
})
export type ApiError = z.infer<typeof ApiError>

export const ResponseMeta = z.object({
  requestId: z.string().min(1),
  apiVersion: z.literal(API_VERSION),
})

/** Envelope único de resposta: exatamente um entre `data` e `error` é preenchido. */
export function envelope<T extends z.ZodType>(data: T) {
  return z.union([
    z.object({ data, error: z.null(), meta: ResponseMeta }),
    z.object({ data: z.null(), error: ApiError, meta: ResponseMeta }),
  ])
}
