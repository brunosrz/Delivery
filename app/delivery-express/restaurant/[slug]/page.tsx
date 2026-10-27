import { Suspense } from "react"
import { notFound } from "next/navigation"
import Image from "next/image"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getFromCacheOrFetch } from "@/lib/redis-client"
import { ProductCard } from "../../components/product-card"

// Componente de carregamento
function RestaurantSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 w-full mb-4"></div>
      <div className="h-8 bg-gray-200 w-1/2 mb-4"></div>
      <div className="h-4 bg-gray-200 w-full mb-2"></div>
      <div className="h-4 bg-gray-200 w-3/4 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    </div>
  )
}

// Componente para exibir uma seção do menu
function MenuSection({
  title,
  products,
  restaurantSlug,
}: {
  title: string
  products: any[]
  restaurantSlug: string
}) {
  if (!products || products.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            title={product.title}
            slug={product.product_slug}
            description={product.description}
            price={product.price}
            imageUrl={product.image_url}
            originalPrice={product.original_price}
            discountPercentage={product.discount_percentage}
            featured={product.featured}
            restaurantSlug={restaurantSlug}
          />
        ))}
      </div>
    </div>
  )
}

// Função para buscar dados do restaurante
async function getRestaurantData(slug: string) {
  return getFromCacheOrFetch(
    `restaurant:${slug}:data`,
    async () => {
      const supabase = createServerSupabaseClient()

      // Busca o restaurante pelo slug
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("restaurant_slug", slug)
        .single()

      if (restaurantError || !restaurant) {
        console.error("Erro ao buscar restaurante:", restaurantError)
        return null
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
        return { restaurant, menu: [] }
      }

      // Para cada seção, busca os produtos associados
      const sectionsWithProducts = await Promise.all(
        sections.map(async (section) => {
          const { data: sectionProducts, error: productsError } = await supabase
            .from("menu_section_products")
            .select(`
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

      return {
        restaurant,
        menu: sectionsWithProducts,
      }
    },
    900, // Cache por 15 minutos
  )
}

// Componente principal da página
export default async function RestaurantPage({ params }: { params: { slug: string } }) {
  const { slug } = params

  // Buscar dados do restaurante
  const restaurantData = await getRestaurantData(slug)

  // Se o restaurante não existir, retornar 404
  if (!restaurantData || !restaurantData.restaurant) {
    notFound()
  }

  const { restaurant, menu } = restaurantData

  return (
    <div className="pb-16">
      <div className="relative h-48 w-full">
        <Image
          src={restaurant.cover_url || "/placeholder.svg?height=192&width=1024&query=restaurant banner"}
          alt={restaurant.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
          <div className="container mx-auto h-full flex items-end pb-4">
            <div className="flex items-center">
              <div className="h-20 w-20 relative mr-4 rounded-full overflow-hidden bg-white">
                <Image
                  src={restaurant.logo_url || "/placeholder.svg?height=80&width=80&query=restaurant logo"}
                  alt={restaurant.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{restaurant.name}</h1>
                {restaurant.description && <p className="text-white/80">{restaurant.description}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto py-8 px-4">
        <Suspense fallback={<RestaurantSkeleton />}>
          {menu.length > 0 ? (
            menu.map((section) => (
              <MenuSection key={section.id} title={section.title} products={section.products} restaurantSlug={slug} />
            ))
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Cardápio não disponível</h2>
              <p className="text-gray-500">Este restaurante ainda não possui itens no cardápio.</p>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  )
}
