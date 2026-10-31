import { type ApiError, type CreateOrderRequest, Order, Quote, type QuoteRequest, envelope } from "@delivery/contracts"
import type { z } from "zod"

export type CallResult<T> = { ok: true; data: T; replayed?: boolean } | { ok: false; status: number; error: ApiError }

const unavailable: CallResult<never> = {
  ok: false,
  status: 0,
  error: { code: "unavailable", message: "Não foi possível falar com o servidor. Tente de novo." },
}

async function call<T extends z.ZodType>(
  path: string,
  schema: T,
  init: RequestInit,
  doFetch: typeof fetch,
): Promise<CallResult<z.infer<T>>> {
  let response: Response
  try {
    response = await doFetch(`/api/v1/${path}`, init)
  } catch {
    return unavailable
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return {
      ok: false,
      status: response.status,
      error: { code: "unavailable", message: "Resposta inválida do servidor." },
    }
  }
  const parsed = envelope(schema).safeParse(body)
  if (!parsed.success) {
    return { ok: false, status: response.status, error: { code: "internal", message: "Resposta fora do contrato." } }
  }
  const result = parsed.data as { data: z.infer<T>; error: null } | { data: null; error: ApiError }
  if (result.error === null) {
    return { ok: true, data: result.data, replayed: response.headers.get("idempotent-replayed") === "true" }
  }
  return { ok: false, status: response.status, error: result.error }
}

const json = (body: unknown, headers: Record<string, string> = {}): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json", ...headers },
  body: JSON.stringify(body),
})

export function requestQuote(input: QuoteRequest, doFetch: typeof fetch = fetch) {
  return call("quotes", Quote, json(input), doFetch)
}

/** A mesma `idempotencyKey` em tentativas repetidas garante um único pedido, mesmo após falha de rede. */
export function submitOrder(input: CreateOrderRequest, idempotencyKey: string, doFetch: typeof fetch = fetch) {
  return call("orders", Order, json(input, { "idempotency-key": idempotencyKey }), doFetch)
}

export function requestPayment(orderId: string, payer: CreateOrderRequest["payer"], doFetch: typeof fetch = fetch) {
  return call(`orders/${encodeURIComponent(orderId)}/payment`, Order, json({ payer }), doFetch)
}

/** Chave por tentativa de pedido: Idempotency-Key aceita 16 a 128 caracteres de [A-Za-z0-9_-]. */
export function newIdempotencyKey(): string {
  return `web-${crypto.randomUUID()}`
}
