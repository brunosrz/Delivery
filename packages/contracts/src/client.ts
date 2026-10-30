import { z } from "zod"
import { Menu, Restaurant } from "./catalog.js"
import { type ApiError, envelope } from "./common.js"

export type ApiResult<T> =
  | { ok: true; data: T; requestId: string | null }
  | { ok: false; status: number; error: ApiError; requestId: string | null }

export type ApiClientOptions = {
  baseUrl: string
  /** Tempo máximo por tentativa. */
  timeoutMs?: number
  /** Novas tentativas para leituras (GET) após falha de rede, timeout ou 5xx. Escritas nunca são repetidas aqui. */
  retries?: number
  fetch?: typeof fetch
  /** Correlaciona a chamada com a requisição de origem. */
  requestId?: string
}

const RETRYABLE_STATUS = new Set([502, 503, 504])

function unavailable(message: string, requestId: string | null): ApiResult<never> {
  return { ok: false, status: 0, error: { code: "unavailable", message }, requestId }
}

export function createApiClient(options: ApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "")
  const timeoutMs = options.timeoutMs ?? 5000
  const retries = options.retries ?? 1
  const doFetch = options.fetch ?? fetch

  async function get<T extends z.ZodType>(path: string, data: T): Promise<ApiResult<z.infer<T>>> {
    const schema = envelope(data)
    let last: ApiResult<z.infer<T>> = unavailable("API indisponível", null)

    for (let attempt = 0; attempt <= retries; attempt++) {
      let response: Response
      try {
        response = await doFetch(`${baseUrl}${path}`, {
          method: "GET",
          headers: {
            accept: "application/json",
            ...(options.requestId ? { "x-request-id": options.requestId } : {}),
          },
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch (error) {
        const timedOut = error instanceof DOMException && error.name === "TimeoutError"
        last = unavailable(timedOut ? "tempo de resposta esgotado" : "falha de rede", null)
        continue
      }

      const requestId = response.headers.get("x-request-id")
      let body: unknown
      try {
        body = await response.json()
      } catch {
        last = unavailable(`resposta não JSON (HTTP ${response.status})`, requestId)
        if (RETRYABLE_STATUS.has(response.status)) continue
        return last
      }

      const parsed = schema.safeParse(body)
      if (!parsed.success) {
        // Contrato quebrado não é repetido: o mesmo payload falharia de novo.
        return {
          ok: false,
          status: response.status,
          error: { code: "internal", message: "resposta fora do contrato v1" },
          requestId,
        }
      }

      // O envelope garante exatamente um entre data e error; o TS não estreita a união genérica sozinho.
      const result = parsed.data as { data: z.infer<T>; error: null } | { data: null; error: ApiError }
      if (result.error === null) {
        return { ok: true, data: result.data, requestId }
      }

      last = { ok: false, status: response.status, error: result.error, requestId }
      if (!RETRYABLE_STATUS.has(response.status)) return last
    }

    return last
  }

  return {
    listRestaurants: () => get("/v1/restaurants", z.array(Restaurant)),
    getMenu: (slug: string) => get(`/v1/restaurants/${encodeURIComponent(slug)}/menu`, Menu),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
