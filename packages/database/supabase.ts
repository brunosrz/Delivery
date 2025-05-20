import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

// Você precisará adicionar estas variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Cliente para uso no lado do cliente
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Cliente com permissões elevadas para uso no lado do servidor
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
})

// Funções de utilidade para produtos (adaptadas para Supabase)
export async function getProductBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(`
      *,
      restaurants:restaurant_id (
        name,
        restaurant_slug
      )
    `)
    .eq("product_slug", slug)
    .eq("available", true)
    .single()

  if (error) {
    console.error("Error fetching product:", error)
    return null
  }

  return data
}

export async function getProductAddons(productId: string) {
  const { data, error } = await supabaseAdmin
    .from("addon_groups")
    .select(`
      *,
      addons (*)
    `)
    .eq("product_id", productId)
    .order("title")

  if (error) {
    console.error("Error fetching product addons:", error)
    return []
  }

  return data
}

export async function getRelatedProducts(productId: string, restaurantId: string, limit = 4) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .neq("id", productId)
    .eq("available", true)
    .order("priority", { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching related products:", error)
    return []
  }

  return data
}

export async function getProductCategories(productId: string) {
  const { data, error } = await supabaseAdmin
    .from("menu_sections")
    .select(`
      *,
      menu_section_products!inner (
        product_id
      )
    `)
    .eq("menu_section_products.product_id", productId)
    .order("priority", { ascending: false, nullsFirst: false })
    .order("title")

  if (error) {
    console.error("Error fetching product categories:", error)
    return []
  }

  return data
}
