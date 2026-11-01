import { cookies, headers } from "next/headers"
import { CONSENT_COOKIE, type Consent, parseConsent } from "@/lib/consent"
import { LOCALE_COOKIE, type Locale, resolveLocale } from "@/lib/locale"

/** Idioma da requisição atual: cookie da escolha, depois o `Accept-Language`, depois o padrão. */
export async function getRequestLocale(): Promise<Locale> {
  const [store, requestHeaders] = await Promise.all([cookies(), headers()])
  return resolveLocale(store.get(LOCALE_COOKIE)?.value, requestHeaders.get("accept-language"))
}

/** Consentimento de cookies já dado, lido no servidor para o banner não piscar na tela. */
export async function getRequestConsent(): Promise<Consent | null> {
  return parseConsent((await cookies()).get(CONSENT_COOKIE)?.value, Date.now())
}
