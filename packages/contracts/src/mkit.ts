import { sanitizeText } from "@delivery/domain"
import { z } from "zod"
import { Id, Timestamp } from "./common.js"

export const MKIT_KINDS = ["post", "cartaz", "promocao"] as const
export const MkitKind = z.enum(MKIT_KINDS)
export const MkitStatus = z.enum(["draft", "published"])

/** Digital (post, story, mensagem) ou físico (cartaz, cardápio impresso). */
export const MKIT_MEDIA = ["digital", "fisico"] as const
export const MkitMedium = z.enum(MKIT_MEDIA)
export type MkitMedium = z.infer<typeof MkitMedium>

/** O texto é sempre limpo na entrada: nada de HTML ou controle chega ao banco nem à exportação. */
const cleanText = (min: number, max: number) =>
  z
    .string()
    .transform((value) => sanitizeText(value))
    .pipe(z.string().min(min).max(max))

export const CreateMkitMaterial = z
  .object({
    title: cleanText(2, 120),
    kind: MkitKind,
    body: cleanText(1, 5000),
    /** Sem informar, o material é digital e sem categoria. */
    medium: MkitMedium.optional(),
    categoryId: Id.nullable().optional(),
  })
  .strict()
export type CreateMkitMaterial = z.infer<typeof CreateMkitMaterial>

export const UpdateMkitMaterial = z
  .object({
    title: cleanText(2, 120),
    kind: MkitKind,
    body: cleanText(1, 5000),
    status: MkitStatus,
    medium: MkitMedium,
    /** `null` tira o material da categoria. */
    categoryId: Id.nullable(),
  })
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
  medium: MkitMedium,
  categoryId: Id.nullable(),
  status: MkitStatus,
  /** Quantas vezes o material foi exportado (métrica de uso). */
  exportCount: z.number().int().nonnegative(),
  /** Preenchido quando o material está na lixeira (restaurável por 30 dias). */
  deletedAt: Timestamp.nullable(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
})
export type MkitMaterial = z.infer<typeof MkitMaterial>

/** Painel de uso do MKit de um restaurante. */
export const MkitMetrics = z.object({
  total: z.number().int().nonnegative(),
  published: z.number().int().nonnegative(),
  drafts: z.number().int().nonnegative(),
  /** Materiais na lixeira (não entram nos outros números). */
  trashed: z.number().int().nonnegative(),
  totalExports: z.number().int().nonnegative(),
  byKind: z.object({
    post: z.number().int().nonnegative(),
    cartaz: z.number().int().nonnegative(),
    promocao: z.number().int().nonnegative(),
  }),
  /** Os cinco materiais mais exportados (só os que já foram exportados). */
  top: z
    .array(z.object({ id: Id, title: z.string(), kind: MkitKind, exportCount: z.number().int().positive() }))
    .max(5),
})
export type MkitMetrics = z.infer<typeof MkitMetrics>

/** Categoria editorial. `platform` vale para todos os restaurantes; `restaurant` é só do restaurante. */
export const MkitCategory = z.object({
  id: Id,
  name: z.string(),
  scope: z.enum(["platform", "restaurant"]),
})
export type MkitCategory = z.infer<typeof MkitCategory>

export const CreateMkitCategory = z.object({ name: cleanText(2, 60) }).strict()
export type CreateMkitCategory = z.infer<typeof CreateMkitCategory>

/** Data real no formato AAAA-MM-DD (recusa 2026-02-31). */
const CalendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "use AAAA-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
  }, "data inexistente")

/** Data comemorativa própria do restaurante, somada ao calendário nacional. */
export const MkitCalendarEvent = z.object({
  id: Id,
  date: CalendarDate,
  name: z.string(),
  /** Repete todo ano no mesmo dia e mês. */
  recurring: z.boolean(),
})
export type MkitCalendarEvent = z.infer<typeof MkitCalendarEvent>

export const CreateMkitCalendarEvent = z
  .object({ date: CalendarDate, name: cleanText(2, 80), recurring: z.boolean().optional() })
  .strict()
export type CreateMkitCalendarEvent = z.infer<typeof CreateMkitCalendarEvent>

/**
 * Geração de rascunho a partir de modelos fixos e dos dados do restaurante (nome, produto, preço). Não usa IA: o texto
 * é determinístico, vira rascunho e passa pela mesma sanitização de qualquer material.
 */
export const MKIT_TEMPLATES = ["promocao", "novidade", "data"] as const
export const GenerateMkitMaterial = z
  .object({
    template: z.enum(MKIT_TEMPLATES),
    /** Obrigatório em `promocao` e `novidade`. */
    productId: Id.optional(),
    /** Obrigatório em `data`: nome da data comemorativa. */
    eventName: cleanText(2, 80).optional(),
    /** Só em `promocao`; sem desconto, o texto destaca o preço. */
    discountPercent: z.number().int().min(1).max(90).optional(),
    medium: MkitMedium.optional(),
    categoryId: Id.nullable().optional(),
  })
  .strict()
export type GenerateMkitMaterial = z.infer<typeof GenerateMkitMaterial>
