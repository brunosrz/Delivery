import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = createServerSupabaseClient()

    // Busca o produto pelo slug
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(
        `
        *,
        restaurant:restaurant_id (
          id,
          name,
          restaurant_slug
        )
      `,
      )
      .eq("product_slug", slug)
      .eq("available", true)
      .single()

    if (productError || !product) {
      console.error("Erro ao buscar produto:", productError)
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    // Busca os grupos de adicionais do produto
    const { data: addonGroups, error: addonGroupsError } = await supabase
      .from("addon_groups")
      .select(
        `
        id,
        title,
        min,
        max,
        required,
        addons (
          id,
          title,
          price
        )
      `,
      )
      .eq("product_id", product.id)
      .order("title")

    if (addonGroupsError) {
      console.error("Erro ao buscar grupos de adicionais:", addonGroupsError)
    }

    // Busca as categorias (seções) do produto
    const { data: sectionLinks, error: sectionLinksError } = await supabase
      .from("menu_section_products")
      .select("section_id")
      .eq("product_id", product.id)

    if (sectionLinksError) {
      console.error("Erro ao buscar seções do produto:", sectionLinksError)
    }

    const sectionIds = (sectionLinks ?? []).map((link) => link.section_id)
    const { data: categories, error: categoriesError } = sectionIds.length
      ? await supabase
          .from("menu_sections")
          .select("id, title")
          .eq("restaurant_id", product.restaurant_id)
          .in("id", sectionIds)
      : { data: [], error: null }

    if (categoriesError) {
      console.error("Erro ao buscar categorias do produto:", categoriesError)
    }

    // Busca produtos relacionados (da mesma categoria)
    const { data: relatedProducts, error: relatedError } = await supabase
      .from("products")
      .select(
        `
        id,
        title,
        description,
        image_url,
        price,
        product_slug,
        original_price,
        discount_percentage,
        featured
      `,
      )
      .eq("restaurant_id", product.restaurant_id)
      .neq("id", product.id)
      .eq("available", true)
      .limit(4)

    if (relatedError) {
      console.error("Erro ao buscar produtos relacionados:", relatedError)
    }

    return NextResponse.json({
      product,
      addonGroups: addonGroups || [],
      categories: categories || [],
      relatedProducts: relatedProducts || [],
    })
  } catch (error) {
    console.error("Erro na rota de produto:", error)
    return NextResponse.json({ error: "Erro ao buscar detalhes do produto" }, { status: 500 })
  }
}
