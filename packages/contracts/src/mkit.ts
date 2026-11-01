import { sanitizeText } from "@delivery/domain"
import { z } from "zod"
import { Id, Timestamp } from "./common.js"

export const MKIT_KINDS = ["post", "cartaz", "promocao"] as const
export const MkitKind = z.enum(MKIT_KINDS)
export const MkitStatus = z.enum(["draft", "published"])

/** O texto é sempre limpo na entrada: nada de HTML ou controle chega ao banco nem à exportação. */
const cleanText = (min: number, max: number) =>
  z
    .string()
    .transform((value) => sanitizeText(value))
    .pipe(z.string().min(min).max(max))

export const CreateMkitMaterial = z
  .object({ title: cleanText(2, 120), kind: MkitKind, body: cleanText(1, 5000) })
  .strict()
export type CreateMkitMaterial = z.infer<typeof CreateMkitMaterial>

export const UpdateMkitMaterial = z
  .object({ title: cleanText(2, 120), kind: MkitKind, body: cleanText(1, 5000), status: MkitStatus })
  .partial()
  .strict()
  .refine((update) => Object.keys(update).length > 0, { message: "informe ao menos um campo" })
export type UpdateMkitMaterial = z.infer<typeof UpdateMkitMaterial>

export const MkitMaterial = z.object({
  id: Id,
  restaurantId: Id,
  title: z.string(),
  kind: MkitKind,
  body: z.string(),
  status: MkitStatus,
  /** Quantas vezes o material foi exportado (métrica de uso). */
  exportCount: z.number().int().nonnegative(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
})
export type MkitMaterial = z.infer<typeof MkitMaterial>
