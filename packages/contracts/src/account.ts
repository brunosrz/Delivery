import { z } from "zod"
import { Id, Timestamp } from "./common.js"
import { Role } from "./identity.js"
import { Order } from "./orders.js"

/** Frase exigida para excluir a conta: evita exclusão por clique acidental ou requisição forjada simples. */
export const DELETE_ACCOUNT_CONFIRMATION = "EXCLUIR MINHA CONTA"

/** Cópia dos dados pessoais do titular (LGPD, art. 18): nunca inclui hash de senha, tokens ou sessões. */
export const AccountExport = z.object({
  exportedAt: Timestamp,
  user: z.object({
    id: Id,
    email: z.email(),
    name: z.string().min(1).max(120),
    role: Role,
    createdAt: Timestamp,
  }),
  orders: z.array(Order),
  /** O cliente tem cadastro de cobrança no Asaas (o identificador em si não é exposto). */
  hasPaymentProfile: z.boolean(),
})
export type AccountExport = z.infer<typeof AccountExport>

export const DeleteAccountRequest = z.object({ confirm: z.literal(DELETE_ACCOUNT_CONFIRMATION) }).strict()
export type DeleteAccountRequest = z.infer<typeof DeleteAccountRequest>

export const DeleteAccountResult = z.object({ deleted: z.literal(true) })
export type DeleteAccountResult = z.infer<typeof DeleteAccountResult>
