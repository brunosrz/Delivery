import { createClient } from "@supabase/supabase-js"

// Exportar tipos e interfaces
export * from "./schema"

// Funções de utilidade para produtos
export async function getProductBySlug(slug: string) {
  const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")

  const { data, error } = await supabase
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
    console.error("Erro ao buscar produto:", error)
    return null
  }

  return data
}

export async function getProductAddons(productId: string) {
  const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")

  const { data, error } = await supabase
    .from("addon_groups")
    .select(`
      *,
      addons (*)
    `)
    .eq("product_id", productId)
    .order("title")

  if (error) {
    console.error("Erro ao buscar grupos de adicionais:", error)
    return []
  }

  return data
}

export async function getRelatedProducts(productId: string, restaurantId: string, limit = 4) {
  const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .neq("id", productId)
    .eq("available", true)
    .order("priority", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Erro ao buscar produtos relacionados:", error)
    return []
  }

  return data
}

export async function getProductCategories(productId: string) {
  const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")

  const { data, error } = await supabase
    .from("menu_sections")
    .select(`
      ms.*
    `)
    .from("menu_sections as ms")
    .join("menu_section_products as msp", "msp.section_id", "ms.id")
    .eq("msp.product_id", productId)
    .order("ms.priority", { ascending: false })

  if (error) {
    console.error("Erro ao buscar categorias do produto:", error)
    return []
  }

  return data
}
