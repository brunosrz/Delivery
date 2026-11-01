import { CONSENT_MAX_AGE_DAYS, CONSENT_VERSION } from "@delivery/contracts"

// Consentimento de cookies. O padrão é recusar: estatística e marketing só ligam depois de um "sim" explícito
// (GDPR/ePrivacy; LGPD art. 8º). O cookie `consent` é essencial e guarda só a escolha, sem identificar a pessoa.

export const CONSENT_COOKIE = "consent"
export type ConsentCategory = "analytics" | "marketing"

export type Consent = {
  /** Versão da lista de categorias; se mudar, o consentimento é pedido de novo. */
  v: number
  /** Identificador aleatório do navegador, usado só para ligar a escolha ao registro no servidor. */
  id: string
  a: boolean
  m: boolean
  /** Instante da escolha, em milissegundos. */
  t: number
}

const DAY_MS = 24 * 60 * 60 * 1000
/** Tolerância para relógios levemente adiantados; além disso o cookie é tratado como inválido. */
const CLOCK_SKEW_MS = 5 * 60 * 1000

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function newConsent(choices: { analytics: boolean; marketing: boolean }, now: number, id?: string): Consent {
  return { v: CONSENT_VERSION, id: id ?? crypto.randomUUID(), a: choices.analytics, m: choices.marketing, t: now }
}

/** Lê o valor do cookie. Qualquer coisa fora do formato, da versão ou do prazo vale como "sem escolha". */
export function parseConsent(raw: string | null | undefined, now: number): Consent | null {
  if (!raw) return null
  let data: unknown
  try {
    data = JSON.parse(decodeURIComponent(raw))
  } catch {
    return null
  }
  if (typeof data !== "object" || data === null) return null
  const { v, id, a, m, t } = data as Record<string, unknown>
  if (v !== CONSENT_VERSION) return null
  if (typeof id !== "string" || !UUID.test(id)) return null
  if (typeof a !== "boolean" || typeof m !== "boolean") return null
  if (typeof t !== "number" || !Number.isFinite(t)) return null
  if (t > now + CLOCK_SKEW_MS || now - t > CONSENT_MAX_AGE_DAYS * DAY_MS) return null
  return { v, id, a, m, t }
}

/** Valor do cookie para uma escolha já feita. */
export const serializeConsent = (consent: Consent) => encodeURIComponent(JSON.stringify(consent))

/** Linha para `document.cookie`. Não é HttpOnly porque o próprio site precisa lê-lo para decidir o que carregar. */
export function consentCookie(consent: Consent, secure: boolean): string {
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60
  return `${CONSENT_COOKIE}=${serializeConsent(consent)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure ? "; Secure" : ""}`
}

/** Lê o cookie de dentro de uma string `document.cookie` (ou do header Cookie). */
export function consentFromCookieHeader(header: string | null | undefined, now: number): Consent | null {
  const entry = (header ?? "").split(";").find((part) => part.trim().startsWith(`${CONSENT_COOKIE}=`))
  return parseConsent(entry?.trim().slice(CONSENT_COOKIE.length + 1), now)
}

/** Único ponto que decide se um recurso opcional pode carregar: sem escolha válida, a resposta é não. */
export const hasConsent = (consent: Consent | null, category: ConsentCategory): boolean =>
  consent !== null && (category === "analytics" ? consent.a : consent.m)

/** Global Privacy Control: o navegador pede para não vender nem compartilhar dados (CCPA/CPRA). */
export const gpcEnabled = (nav: { globalPrivacyControl?: boolean } | undefined): boolean =>
  nav?.globalPrivacyControl === true
