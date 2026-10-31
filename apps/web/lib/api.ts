import { createApiClient, type ApiClient } from "@delivery/contracts"

/**
 * Cliente da Casa das Máquinas para Server Components. Sem CASA_DAS_MAQUINAS_URL
 * o catálogo é tratado como indisponível, em vez de cair em dados fictícios.
 */
export function getApiClient(): ApiClient | null {
  const baseUrl = process.env.CASA_DAS_MAQUINAS_URL
  if (!baseUrl) return null
  return createApiClient({ baseUrl, timeoutMs: 4000, retries: 1 })
}
