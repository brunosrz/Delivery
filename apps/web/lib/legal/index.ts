import { LEGAL_VERSIONS } from "@delivery/contracts"
import type { Locale } from "@/lib/locale"
import { cookies } from "./cookies"
import { privacy } from "./privacy"
import { terms } from "./terms"
import type { LegalContent, LegalKind } from "./types"

const DOCUMENTS: Record<LegalKind, Record<Locale, LegalContent>> = { terms, privacy, cookies }

export const getLegalDocument = (kind: LegalKind, locale: Locale): LegalContent => DOCUMENTS[kind][locale]

/** Versão exibida na página; cookies segue a da política de privacidade, da qual faz parte. */
export const legalVersion = (kind: LegalKind): string =>
  kind === "terms" ? LEGAL_VERSIONS.terms : LEGAL_VERSIONS.privacy

export { COOKIE_REGISTRY } from "./cookies"
export type { LegalContent, LegalKind } from "./types"
