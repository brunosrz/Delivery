import { z } from "zod"
import { Menu, Restaurant } from "./catalog.js"
import { type ApiError, envelope } from "./common.js"
import { CreateOrderRequest, Order, Quote, QuoteRequest } from "./orders.js"

export type ApiResult<T> =
  | { ok: true; data: T; requestId: string | null }
  | { ok: false; status: number; error: ApiError; requestId: string | null }

export type ApiClientOptions = {
  baseUrl: string
  /** Tempo máximo por tentativa. */
  timeoutMs?: number
  /** Novas tentativas para leituras (GET) e para criação de pedido com a mesma Idempotency-Key, após falha de rede, timeout, 502, 503 ou 504. */
  retries?: number
  fetch?: typeof fetch
  /** Correlaciona a chamada com a requisição de origem. */
  requestId?: string
}

const RETRYABLE_STATUS = new Set([502, 503, 504])
/** Teto da espera pedida por Retry-After, para um servidor lento não prender o chamador. */
const MAX_RETRY_AFTER_MS = 2000

/** Headers extras por chamada, por exemplo o cookie repassado por um Server Component. */
export type CallOptions = { headers?: Record<string, string> }

function unavailable(message: string, requestId: string | null): ApiResult<never> {
  return { ok: false, status: 0, error: { code: "unavailable", message }, requestId }
}

// Remove barras finais sem regex: uma expressão do tipo "barra+ no fim" tem custo quadrático em entradas com muitas barras.
function trimTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && value.charCodeAt(end - 1) === 47) end--
  return value.slice(0, end)
}

function retryAfterMs(response: Response): number {
  const seconds = Number(response.headers.get("retry-after"))
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, MAX_RETRY_AFTER_MS) : 0
}

export function createApiClient(options: ApiClientOptions) {
  const baseUrl = trimTrailingSlashes(options.baseUrl)
  const timeoutMs = options.timeoutMs ?? 5000
  const retries = options.retries ?? 1
  const doFetch = options.fetch ?? fetch

  type RequestInput<T extends z.ZodType> = {
    method: "GET" | "POST"
    path: string
    data: T
    body?: unknown
    headers?: Record<string, string>
    /** Só leituras e escritas com Idempotency-Key podem ser repetidas. */
    retryable: boolean
  }

  async function request<T extends z.ZodType>(input: RequestInput<T>): Promise<ApiResult<z.infer<T>>> {
    const schema = envelope(input.data)
    const attempts = input.retryable ? retries : 0
    let last: ApiResult<z.infer<T>> = unavailable("API indisponível", null)
    let wait = 0

    for (let attempt = 0; attempt <= attempts; attempt++) {
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
      wait = 0
      let response: Response
      try {
        response = await doFetch(`${baseUrl}${input.path}`, {
          method: input.method,
          headers: {
            accept: "application/json",
            ...(input.body !== undefined ? { "content-type": "application/json" } : {}),
            ...(options.requestId ? { "x-request-id": options.requestId } : {}),
            ...input.headers,
          },
          ...(input.body !== undefined ? { body: JSON.stringify(input.body) } : {}),
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch (error) {
        const timedOut = error instanceof DOMException && error.name === "TimeoutError"
        last = unavailable(timedOut ? "tempo de resposta esgotado" : "falha de rede", null)
        continue
      }

      const headerRequestId = response.headers.get("x-request-id")
      let body: unknown
      try {
        body = await response.json()
      } catch {
        last = unavailable(`resposta não JSON (HTTP ${response.status})`, headerRequestId)
        if (RETRYABLE_STATUS.has(response.status)) {
          wait = retryAfterMs(response)
          continue
        }
        return last
      }

      const parsed = schema.safeParse(body)
      // Envelope de sucesso com status fora de 2xx também é contrato quebrado.
      if (!parsed.success || (parsed.data.error === null && !response.ok)) {
        // Contrato quebrado não é repetido: o mesmo payload falharia de novo.
        return {
          ok: false,
          status: response.status,
          error: { code: "internal", message: "resposta fora do contrato v1" },
          requestId: headerRequestId,
        }
      }

      const requestId = headerRequestId ?? parsed.data.meta.requestId
      // O envelope garante exatamente um entre data e error; o TS não estreita a união genérica sozinho.
      const result = parsed.data as { data: z.infer<T>; error: null } | { data: null; error: ApiError }
      if (result.error === null) {
        return { ok: true, data: result.data, requestId }
      }

      last = { ok: false, status: response.status, error: result.error, requestId }
      if (!RETRYABLE_STATUS.has(response.status)) return last
      wait = retryAfterMs(response)
    }

    return last
  }

  return {
    listRestaurants: (call: CallOptions = {}) =>
      request({
        method: "GET",
        path: "/v1/restaurants",
        data: z.array(Restaurant),
        headers: call.headers,
        retryable: true,
      }),
    getMenu: (slug: string, call: CallOptions = {}) =>
      request({
        method: "GET",
        path: `/v1/restaurants/${encodeURIComponent(slug)}/menu`,
        data: Menu,
        headers: call.headers,
        retryable: true,
      }),
    /** Cotação calculada no servidor; é uma leitura sem efeitos, mas fica sem retry por ser POST. */
    quoteCart: (quote: QuoteRequest, call: CallOptions = {}) =>
      request({
        method: "POST",
        path: "/v1/quotes",
        data: Quote,
        body: quote,
        headers: call.headers,
        retryable: false,
      }),
    /** A mesma Idempotency-Key torna seguro repetir a criação após timeout ou 5xx transitório. */
    createOrder: (order: CreateOrderRequest, idempotencyKey: string, call: CallOptions = {}) =>
      request({
        method: "POST",
        path: "/v1/orders",
        data: Order,
        body: order,
        headers: { ...call.headers, "idempotency-key": idempotencyKey },
        retryable: true,
      }),
    getOrder: (orderId: string, call: CallOptions = {}) =>
      request({
        method: "GET",
        path: `/v1/orders/${encodeURIComponent(orderId)}`,
        data: Order,
        headers: call.headers,
        retryable: true,
      }),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
