import { z } from "zod"
import { Timestamp } from "./common.js"

/** Métodos cobrados online pelo Asaas; os demais são pagos na entrega e não geram cobrança. */
export const ONLINE_PAYMENT_METHODS = ["pix", "card"] as const

export const PaymentMethod = z.enum(["cash", "pix_on_delivery", "card_on_delivery", ...ONLINE_PAYMENT_METHODS])
export type PaymentMethod = z.infer<typeof PaymentMethod>

export function isOnlinePayment(method: PaymentMethod): boolean {
  return (ONLINE_PAYMENT_METHODS as readonly string[]).includes(method)
}

/**
 * Dados do pagador exigidos pelo Asaas para emitir a cobrança. O CPF/CNPJ é enviado ao provedor e
 * nunca é gravado pela Casa das Máquinas.
 */
export const Payer = z
  .object({
    name: z.string().trim().min(2).max(120),
    cpfCnpj: z
      .string()
      .transform((value) => value.replace(/\D/g, ""))
      .pipe(z.string().regex(/^(\d{11}|\d{14})$/, "CPF ou CNPJ inválido")),
    email: z.email().optional(),
    mobilePhone: z
      .string()
      .transform((value) => value.replace(/\D/g, ""))
      .pipe(z.string().regex(/^\d{10,11}$/, "telefone inválido"))
      .optional(),
  })
  .strict()
export type Payer = z.infer<typeof Payer>

export const PixCharge = z.object({
  /** Código "copia e cola". */
  payload: z.string().min(1),
  /** QR Code em Base64 (PNG), para exibir em <img src="data:image/png;base64,...">. */
  qrCodeImage: z.string().min(1),
  expiresAt: Timestamp.nullable(),
})

/**
 * Cobrança online de um pedido. Para `pix` o cliente paga pelo QR Code; para `card` (crédito ou débito) o
 * cliente é enviado à fatura hospedada do Asaas (`invoiceUrl`), de modo que nenhum dado de cartão passa por aqui.
 */
export const Charge = z.object({
  provider: z.literal("asaas"),
  chargeId: z.string().min(1),
  invoiceUrl: z.url().nullable(),
  pix: PixCharge.nullable(),
})
export type Charge = z.infer<typeof Charge>
