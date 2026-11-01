import type { Consent } from "@/lib/consent"
import type { Locale } from "@/lib/locale"

/**
 * Manda a escolha ao servidor, que a guarda como prova do consentimento. É "melhor esforço": a escolha já vale no
 * navegador pelo cookie, e uma falha de rede não pode travar a navegação.
 */
export async function reportConsent(
  consent: Consent,
  source: "banner" | "preferences" | "gpc",
  locale: Locale,
  doFetch: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await doFetch("/api/v1/consents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        consentId: consent.id,
        version: consent.v,
        analytics: consent.a,
        marketing: consent.m,
        source,
        locale,
      }),
      keepalive: true,
    })
    return response.ok
  } catch {
    return false
  }
}
