import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params
    const supabase = createServerSupabaseClient()

    // Primeiro, busca o restaurante pelo slug
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id, name")
      .eq("restaurant_slug", slug)
      .single()

    if (restaurantError || !restaurant) {
      console.error("Erro ao buscar restaurante:", restaurantError)
      return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 })
    }

    // Busca as seções do menu com seus produtos
    const { data: sections, error: sectionsError } = await supabase
      .from("menu_sections")
      .select(`
        id,
        title,
        is_recommended,
        priority
      `)
      .eq("restaurant_id", restaurant.id)
      .order("priority", { ascending: false })
      .order("title")

    if (sectionsError) {
      console.error("Erro ao buscar seções do menu:", sectionsError)
      return NextResponse.json({ error: "Erro ao buscar menu do restaurante" }, { status: 500 })
    }

    // Para cada seção, busca os produtos associados
    const sectionsWithProducts = await Promise.all(
      sections.map(async (section) => {
        const { data: sectionProducts, error: productsError } = await supabase
          .from("menu_section_products")
          .select(`
            product_id,
            products (
              id,
              title,
              description,
              image_url,
              price,
              product_slug,
              original_price,
              discount_percentage,
              featured,
              preparation_time,
              available
            )
          `)
          .eq("section_id", section.id)

        if (productsError) {
          console.error("Erro ao buscar produtos da seção:", productsError)
          return {
            ...section,
            products: [],
          }
        }

        // Formata os produtos para remover a estrutura aninhada
        const products = sectionProducts
          .map((item) => item.products)
          .filter((product) => product && product.available !== false)

        return {
          ...section,
          products,
        }
      }),
    )

    return NextResponse.json({
      restaurant,
      menu: sectionsWithProducts,
    })
  } catch (error: any) {
    console.error("Erro na rota de menu:", error)
    return NextResponse.json({ error: "Erro ao buscar menu do restaurante" }, { status: 500 })
  }
}
