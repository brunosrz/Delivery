import { z } from "zod"
import { Id, Timestamp } from "./common.js"

/**
 * Versões vigentes dos documentos legais. Mudou o texto de forma relevante: suba a versão aqui. Quem aceitou uma versão
 * anterior precisa aceitar de novo, e o servidor recusa aceite de versão que não seja a vigente.
 */
export const LEGAL_VERSIONS = { terms: "2026-11-01", privacy: "2026-11-01" } as const

export const LEGAL_DOCUMENTS = ["terms", "privacy"] as const
export const LegalDocument = z.enum(LEGAL_DOCUMENTS)
export type LegalDocument = z.infer<typeof LegalDocument>

/** Versão da lista de categorias de cookies. Mudou a lista ou a finalidade: suba e o consentimento é pedido de novo. */
export const CONSENT_VERSION = 1
/** O consentimento vale por 12 meses (recomendação das autoridades europeias); depois o banner volta. */
export const CONSENT_MAX_AGE_DAYS = 365

export const ConsentSource = z.enum(["banner", "preferences", "gpc"])
export type ConsentSource = z.infer<typeof ConsentSource>

/** Registro de consentimento de cookies: prova, no servidor, do que o visitante escolheu e quando. */
export const ConsentRequest = z
  .object({
    /** Identificador aleatório do navegador, gerado no cliente; não identifica a pessoa. */
    consentId: z.uuid(),
    version: z.number().int().positive(),
    analytics: z.boolean(),
    marketing: z.boolean(),
    source: ConsentSource,
    locale: z.string().min(2).max(10),
  })
  .strict()
export type ConsentRequest = z.infer<typeof ConsentRequest>

export const ConsentReceipt = z.object({ recorded: z.literal(true) })
export type ConsentReceipt = z.infer<typeof ConsentReceipt>

/** Aceite dos Termos de Uso e da Política de Privacidade, sempre da versão vigente. */
export const LegalAcceptanceRequest = z
  .object({ terms: z.string().min(1).max(20), privacy: z.string().min(1).max(20) })
  .strict()
export type LegalAcceptanceRequest = z.infer<typeof LegalAcceptanceRequest>

export const LegalAcceptanceReceipt = z.object({ accepted: z.literal(true) })
export type LegalAcceptanceReceipt = z.infer<typeof LegalAcceptanceReceipt>

/** O que o titular recebe na exportação sobre aceites e consentimentos ligados à conta dele. */
export const LegalRecords = z.object({
  acceptances: z.array(z.object({ document: LegalDocument, version: z.string(), acceptedAt: Timestamp })),
  consents: z.array(
    z.object({
      consentId: Id,
      version: z.number().int().positive(),
      analytics: z.boolean(),
      marketing: z.boolean(),
      source: ConsentSource,
      recordedAt: Timestamp,
    }),
  ),
})
export type LegalRecords = z.infer<typeof LegalRecords>
