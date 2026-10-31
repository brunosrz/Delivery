import { z } from "zod"

/**
 * Mensagem do formulário de contato do site institucional. `website` é uma armadilha para robôs: pessoas não
 * veem o campo e ele chega sempre vazio.
 */
export const ContactRequest = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.email().max(200),
    message: z.string().trim().min(10).max(2000),
    website: z.string().max(200).optional(),
    /** Token do desafio Turnstile, quando o site o exibe. */
    turnstileToken: z.string().max(2048).optional(),
  })
  .strict()
export type ContactRequest = z.infer<typeof ContactRequest>

export const ContactReceipt = z.object({ received: z.literal(true) })
export type ContactReceipt = z.infer<typeof ContactReceipt>
