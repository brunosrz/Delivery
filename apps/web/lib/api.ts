import { createApiClient, type ApiClient } from "@delivery/contracts"

/**
 * Cliente da API para Server Components. Sem API_URL
 * o catálogo é tratado como indisponível, em vez de cair em dados fictícios.
 */
export function getApiClient(): ApiClient | null {
  const baseUrl = process.env.API_URL
  if (!baseUrl) return null
  return createApiClient({ baseUrl, timeoutMs: 4000, retries: 1, requestId: crypto.randomUUID() })
}
