import Image from "next/image"
import { formatCents } from "@/lib/utils"
import { ProductCard } from "@/app/delivery-express/components/product-card"
import { CatalogUnavailable } from "@/app/delivery-express/catalog-unavailable"
import { loadMenu } from "@/app/delivery-express/menu"

export const dynamic = "force-dynamic"

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const loaded = await loadMenu(slug)
  if (loaded.status === "unavailable") return <CatalogUnavailable title="Delivery Express" />

  const { restaurant, sections } = loaded.menu
  const visibleSections = sections.filter((section) => section.products.length > 0)

  return (
    <div className="pb-16">
      <div className="relative h-48 w-full bg-gray-200">
        {restaurant.coverUrl && <Image src={restaurant.coverUrl} alt="" fill className="object-cover" priority />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
          <div className="container mx-auto h-full flex items-end px-4 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{restaurant.name}</h1>
              {restaurant.description && <p className="text-white/90">{restaurant.description}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <dl className="flex flex-wrap gap-x-6 gap-y-1 mb-8 text-sm text-gray-700">
          <div>
            <dt className="inline font-medium">Status: </dt>
            <dd className="inline">{restaurant.isOpen ? "Aberto" : "Fechado"}</dd>
          </div>
          {restaurant.deliveryEnabled && (
            <div>
              <dt className="inline font-medium">Taxa de entrega: </dt>
              <dd className="inline">{formatCents(restaurant.deliveryFeeCents)}</dd>
            </div>
          )}
          {restaurant.minimumOrderCents > 0 && (
            <div>
              <dt className="inline font-medium">Pedido mínimo: </dt>
              <dd className="inline">{formatCents(restaurant.minimumOrderCents)}</dd>
            </div>
          )}
        </dl>

        {visibleSections.length === 0 ? (
          <p className="text-center py-12 text-gray-600">Este restaurante ainda não cadastrou produtos.</p>
        ) : (
          visibleSections.map((section) => (
            <section key={section.id} aria-labelledby={`secao-${section.id}`} className="mb-8">
              <h2 id={`secao-${section.id}`} className="text-xl font-bold mb-4">
                {section.name}
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.products.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} restaurantSlug={restaurant.slug} />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
