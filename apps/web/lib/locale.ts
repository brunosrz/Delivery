import { baseLocale, cookieMaxAge, cookieName, locales } from "@/lib/paraglide/runtime.js"

export type Locale = (typeof locales)[number]

export const LOCALES: readonly Locale[] = locales
export const DEFAULT_LOCALE: Locale = baseLocale
export const LOCALE_COOKIE = cookieName

export const isSupportedLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale)

/** Primeiro idioma suportado, na ordem de preferência (`q`) do `Accept-Language`; "pt" vale como pt-BR, "en-US" como en. */
function fromAcceptLanguage(header: string): Locale | null {
  const preferences = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";")
      const quality = Number(params.find((param) => param.trim().startsWith("q="))?.split("=")[1] ?? "1")
      return { tag: tag.trim().toLowerCase(), quality: Number.isFinite(quality) ? quality : 0, index }
    })
    .filter((item) => item.tag && item.tag !== "*" && item.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)

  for (const { tag } of preferences) {
    const exact = LOCALES.find((locale) => locale.toLowerCase() === tag)
    if (exact) return exact
    const language = tag.split("-")[0]
    const sameLanguage = LOCALES.find((locale) => locale.toLowerCase().split("-")[0] === language)
    if (sameLanguage) return sameLanguage
  }
  return null
}

/** Idioma da requisição: cookie escolhido pela pessoa, depois o do navegador, depois o padrão. */
export function resolveLocale(cookieValue: string | undefined, acceptLanguage: string | null | undefined): Locale {
  if (isSupportedLocale(cookieValue)) return cookieValue
  return (acceptLanguage ? fromAcceptLanguage(acceptLanguage) : null) ?? DEFAULT_LOCALE
}

/** Valor para `document.cookie`: a escolha de idioma é um cookie essencial de preferência (sem rastreamento). */
export function localeCookie(locale: Locale, secure: boolean): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax${secure ? "; Secure" : ""}`
}
