import { Suspense } from "react"
import { notFound } from "next/navigation"
import Image from "next/image"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getFromCacheOrFetch } from "@/lib/redis-client"
import { ProductCard } from "@/app/delivery-express/components/product-card"
import { addToCart } from "@/app/delivery-express/actions"

// Componente de carregamento
function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 w-full mb-4 rounded-lg"></div>
      <div className="h-8 bg-gray-200 w-1/2 mb-4"></div>
      <div className="h-4 bg-gray-200 w-full mb-2"></div>
      <div className="h-4 bg-gray-200 w-3/4 mb-4"></div>
      <div className="h-10 bg-gray-200 w-1/3 mb-4"></div>
    </div>
  )
}

// Componente para exibir informações nutricionais
function NutritionalInfo({ info }: { info: Record<string, any> | null }) {
  if (!info) return null

  return (
    <div className="mt-6 bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold text-lg mb-2">Informações Nutricionais</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(info).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-600">{key}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Componente para exibir ingredientes
function Ingredients({ ingredients }: { ingredients: string[] | null }) {
  if (!ingredients || ingredients.length === 0) return null

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-lg mb-2">Ingredientes</h3>
      <ul className="list-disc pl-5 space-y-1">
        {ingredients.map((ingredient, index) => (
          <li key={index} className="text-gray-600">
            {ingredient}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Componente para exibir grupos de adicionais
function AddonGroups({ addonGroups }: { addonGroups: any[] }) {
  if (!addonGroups || addonGroups.length === 0) return null

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-lg mb-4">Adicionais</h3>
      {addonGroups.map((group) => (
        <div key={group.id} className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">{group.title}</h4>
            <span className="text-sm text-gray-500">
              {group.required ? "Obrigatório" : "Opcional"} •{group.min > 0 ? ` Mín ${group.min}` : ""}
              {group.max ? ` • Máx ${group.max}` : ""}
            </span>
          </div>
          <div className="space-y-2">
            {group.addons.map((addon: any) => (
              <div key={addon.id} className="flex items-center justify-between p-3 border rounded-lg">
                <label className="flex items-center flex-1">
                  <input
                    type={group.max === 1 ? "radio" : "checkbox"}
                    name={`addon-group-${group.id}`}
                    className="mr-3"
                  />
                  <span>{addon.title}</span>
                </label>
                {addon.price > 0 && (
                  <span className="font-medium">+ R$ {addon.price.toFixed(2).replace(".", ",")}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Componente para exibir produtos relacionados
function RelatedProducts({
  products,
  restaurantSlug,
}: {
  products: any[]
  restaurantSlug: string
}) {
  if (!products || products.length === 0) return null

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">Você também pode gostar</h3>
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

// Função para buscar dados do produto
async function getProductData(restaurantSlug: string, productSlug: string) {
  return getFromCacheOrFetch(
    `restaurant:${restaurantSlug}:product:${productSlug}`,
    async () => {
      const supabase = createServerSupabaseClient()

      // Busca o restaurante pelo slug
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id, name, restaurant_slug")
        .eq("restaurant_slug", restaurantSlug)
        .single()

      if (restaurantError || !restaurant) {
        console.error("Erro ao buscar restaurante:", restaurantError)
        return null
      }

      // Busca o produto pelo slug
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("product_slug", productSlug)
        .eq("available", true)
        .single()

      if (productError || !product) {
        console.error("Erro ao buscar produto:", productError)
        return null
      }

      // Busca os grupos de adicionais do produto
      const { data: addonGroups, error: addonGroupsError } = await supabase
        .from("addon_groups")
        .select(`
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
        `)
        .eq("product_id", product.id)
        .order("title")

      if (addonGroupsError) {
        console.error("Erro ao buscar grupos de adicionais:", addonGroupsError)
        return {
          restaurant,
          product,
          addonGroups: [],
          relatedProducts: [],
        }
      }

      // Busca produtos relacionados (da mesma categoria)
      const { data: relatedProducts, error: relatedError } = await supabase
        .from("products")
        .select(`
          id,
          title,
          description,
          image_url,
          price,
          product_slug,
          original_price,
          discount_percentage,
          featured
        `)
        .eq("restaurant_id", restaurant.id)
        .neq("id", product.id)
        .eq("available", true)
        .limit(3)

      if (relatedError) {
        console.error("Erro ao buscar produtos relacionados:", relatedError)
        return {
          restaurant,
          product,
          addonGroups,
          relatedProducts: [],
        }
      }

      return {
        restaurant,
        product,
        addonGroups,
        relatedProducts,
      }
    },
    900, // Cache por 15 minutos
  )
}

// Componente principal da página
export default async function ProductPage({
  params,
}: {
  params: { slug: string; productSlug: string }
}) {
  const { slug, productSlug } = params

  // Buscar dados do produto
  const productData = await getProductData(slug, productSlug)

  // Se o produto não existir, retornar 404
  if (!productData || !productData.product) {
    notFound()
  }

  const { restaurant, product, addonGroups, relatedProducts } = productData

  const formattedPrice = product.price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  const formattedOriginalPrice = product.original_price?.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  return (
    <div className="pb-16">
      <main className="container mx-auto py-8 px-4">
        <Suspense fallback={<ProductSkeleton />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative h-80 rounded-lg overflow-hidden">
              <Image
                src={product.image_url || "/placeholder.svg?height=320&width=640&query=food"}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
              {product.discount_percentage && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-md">
                  {product.discount_percentage}% OFF
                </div>
              )}
              {product.featured && (
                <div className="absolute top-4 right-4 bg-amber-500 text-white px-2 py-1 rounded-md">Destaque</div>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>

              {product.description && <p className="text-gray-600 mb-4">{product.description}</p>}

              <div className="flex items-end mb-6">
                <div>
                  <div className="text-3xl font-bold text-orange-600">{formattedPrice}</div>

                  {product.original_price && (
                    <div className="text-sm text-gray-500 line-through">{formattedOriginalPrice}</div>
                  )}
                </div>

                {product.preparation_time && (
                  <div className="ml-auto text-sm text-gray-500">
                    ⏱️ Tempo de preparo: {product.preparation_time} min
                  </div>
                )}
              </div>

              <form action={addToCart}>
                <input type="hidden" name="productId" value={product.id} />

                <div className="mb-4">
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade
                  </label>
                  <select id="quantity" name="quantity" className="w-full p-2 border rounded-md" defaultValue="1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    className="w-full p-2 border rounded-md"
                    placeholder="Ex: Sem cebola, molho à parte, etc."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-md font-medium hover:bg-orange-700 transition-colors"
                >
                  Adicionar ao Carrinho
                </button>
              </form>
            </div>
          </div>

          <Ingredients ingredients={product.ingredients} />

          <NutritionalInfo info={product.nutritional_info} />

          <AddonGroups addonGroups={addonGroups} />

          <RelatedProducts products={relatedProducts} restaurantSlug={slug} />
        </Suspense>
      </main>
    </div>
  )
}
