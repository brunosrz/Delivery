import type { Database } from "@/types/supabase"

type Tables = Database["public"]["Tables"]

export type ListedProduct = Pick<
  Tables["products"]["Row"],
  | "id"
  | "title"
  | "description"
  | "image_url"
  | "price"
  | "product_slug"
  | "original_price"
  | "discount_percentage"
  | "featured"
>

export type Addon = Pick<Tables["addons"]["Row"], "id" | "title" | "price">

export type AddonGroupWithAddons = Pick<Tables["addon_groups"]["Row"], "id" | "title" | "min" | "max" | "required"> & {
  addons: Addon[]
}
