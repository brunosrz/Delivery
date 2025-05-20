"use client"

import { Suspense } from "react"
import { notFound } from "next/navigation"
import Image from "next/image"
import { getProductBySlug, getProductAddons, getRelatedProducts, getProductCategories } from "@/packages/database"
import { FoodCard } from "../components/food-card"
import { FlexGrid } from "../components/flex-grid"
import { Header } from "../components/header"
import { AppBar } from "../components/app-bar"
import { SectionHeader } from "../components/section-header"
import { PromoBadge } from "../components/badges/promo-badge"
import { SizeBadge } from "../components/badges/size-badge"
import { QuantitySelector } from "../components/quantity-selector"
import { CartButton } from "../components/cart-button"

// Componente para carregamento
function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
      <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
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
async function RelatedProducts({ productId, restaurantId }: { productId: string; restaurantId: string }) {
  const relatedProducts = await getRelatedProducts(productId, restaurantId)

  if (!relatedProducts || relatedProducts.length === 0) return null

  return (
    <div className="mt-8">
      <SectionHeader title="Você também pode gostar" />
      <FlexGrid>
        {relatedProducts.map((product) => (
          <FoodCard
            key={product.id}
            id={product.id}
            name={product.title}
            description={product.description || ""}
            price={Number.parseFloat(product.price)}
            originalPrice={product.original_price ? Number.parseFloat(product.original_price) : undefined}
            discount={product.discount_percentage}
            image={product.image_url || "/placeholder.svg?key=food"}
            tag={product.featured ? "Destaque" : undefined}
            size={undefined}
            onClick={() => {}}
          />
        ))}
      </FlexGrid>
    </div>
  )
}

// Componente principal da página
export default async function FoodPage({ params }: { params: { food: string } }) {
  const { food } = params

  // Buscar dados do produto
  const product = await getProductBySlug(food)

  // Se o produto não existir, retornar 404
  if (!product) {
    notFound()
  }

  // Buscar adicionais do produto
  const addonGroups = await getProductAddons(product.id)

  // Buscar categorias do produto
  const categories = await getProductCategories(product.id)

  return (
    <div className="pb-16">
      {/* Header fixo */}
      <Header onSearch={() => {}} />

      {/* Conteúdo principal */}
      <main className="container mx-auto pt-20 px-4">
        <div className="relative mb-4">
          <Image
            src={product.image_url || "/placeholder.svg?key=food-detail"}
            alt={product.title}
            width={800}
            height={400}
            className="w-full h-64 object-cover rounded-lg"
            priority
          />

          {product.discount_percentage && (
            <div className="absolute top-4 left-4">
              <PromoBadge>{product.discount_percentage}% OFF</PromoBadge>
            </div>
          )}

          {product.featured && (
            <div className="absolute top-4 right-4">
              <SizeBadge>Destaque</SizeBadge>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{product.title}</h1>

          <div className="flex items-center mb-4">
            {categories &&
              categories.map((category: any) => (
                <span key={category.id} className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded mr-2">
                  {category.title}
                </span>
              ))}

            {product.preparation_time && (
              <span className="text-sm text-gray-500 ml-auto">⏱️ {product.preparation_time} min</span>
            )}
          </div>

          <p className="text-gray-600 mb-4">{product.description}</p>

          <div className="flex items-end mb-6">
            <div>
              <div className="text-2xl font-bold text-orange-600">
                R$ {Number.parseFloat(product.price).toFixed(2).replace(".", ",")}
              </div>

              {product.original_price && (
                <div className="text-sm text-gray-500 line-through">
                  R$ {Number.parseFloat(product.original_price).toFixed(2).replace(".", ",")}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <QuantitySelector initialQuantity={1} onChange={(quantity) => console.log("Quantidade:", quantity)} />

            <CartButton onClick={() => console.log("Adicionar ao carrinho")} disabled={false} />
          </div>
        </div>

        <Ingredients ingredients={product.ingredients} />

        <NutritionalInfo info={product.nutritional_info} />

        <AddonGroups addonGroups={addonGroups || []} />

        <Suspense
          fallback={
            <div className="mt-8 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            </div>
          }
        >
          <RelatedProducts productId={product.id} restaurantId={product.restaurant_id} />
        </Suspense>
      </main>

      {/* App bar fixo na parte inferior */}
      <AppBar />
    </div>
  )
}
