import { LEGAL_VERSIONS } from "@delivery/contracts"

/** Registra o aceite dos Termos de Uso e da Política de Privacidade na versão vigente. Devolve se o servidor gravou. */
export async function acceptLegalDocuments(doFetch: typeof fetch = fetch): Promise<boolean> {
  try {
    const response = await doFetch("/api/v1/legal/acceptances", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ terms: LEGAL_VERSIONS.terms, privacy: LEGAL_VERSIONS.privacy }),
    })
    return response.ok
  } catch {
    return false
  }
}
