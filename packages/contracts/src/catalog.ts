import { z } from "zod"
import { Cents, Id, Slug } from "./common.js"

export const OpeningHours = z.object({
  /** 0 = domingo ... 6 = sábado */
  weekday: z.number().int().min(0).max(6),
  /** Minutos desde 00:00 no fuso do restaurante. */
  opensAt: z.number().int().min(0).max(1439),
  closesAt: z.number().int().min(1).max(1440),
})

export const Restaurant = z.object({
  id: Id,
  slug: Slug,
  name: z.string().min(1).max(120),
  description: z.string().max(500).nullable(),
  logoUrl: z.url().nullable(),
  coverUrl: z.url().nullable(),
  timezone: z.string().min(1),
  isOpen: z.boolean(),
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  deliveryFeeCents: Cents,
  minimumOrderCents: Cents,
  openingHours: z.array(OpeningHours),
})
export type Restaurant = z.infer<typeof Restaurant>

export const AddonOption = z.object({
  id: Id,
  name: z.string().min(1).max(120),
  priceCents: Cents,
  available: z.boolean(),
})
export type AddonOption = z.infer<typeof AddonOption>

export const AddonGroup = z
  .object({
    id: Id,
    name: z.string().min(1).max(120),
    minSelections: z.number().int().nonnegative(),
    maxSelections: z.number().int().positive(),
    options: z.array(AddonOption).min(1),
  })
  .refine((group) => group.minSelections <= group.maxSelections, {
    message: "minSelections não pode ser maior que maxSelections",
    path: ["minSelections"],
  })
export type AddonGroup = z.infer<typeof AddonGroup>

export const Product = z.object({
  id: Id,
  restaurantId: Id,
  slug: Slug,
  name: z.string().min(1).max(120),
  description: z.string().max(1000).nullable(),
  imageUrl: z.url().nullable(),
  priceCents: Cents,
  originalPriceCents: Cents.nullable(),
  available: z.boolean(),
  /** Limite por item no carrinho. */
  maxQuantity: z.number().int().positive().max(99),
  addonGroups: z.array(AddonGroup),
})
export type Product = z.infer<typeof Product>

export const MenuSection = z.object({
  id: Id,
  name: z.string().min(1).max(120),
  position: z.number().int().nonnegative(),
  products: z.array(Product),
})
export type MenuSection = z.infer<typeof MenuSection>

export const Menu = z.object({
  restaurant: Restaurant,
  sections: z.array(MenuSection),
})
export type Menu = z.infer<typeof Menu>
