import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { formatCents } from "@/lib/utils"
import { CatalogUnavailable } from "@/app/delivery-express/catalog-unavailable"
import { AddToCart } from "@/app/delivery-express/components/add-to-cart"
import { loadMenu } from "@/app/delivery-express/menu"

export const dynamic = "force-dynamic"

export default async function ProductPage({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params
  const loaded = await loadMenu(slug)
  if (loaded.status === "unavailable") return <CatalogUnavailable title="Delivery Express" />

  const { restaurant, sections } = loaded.menu
  const product = sections.flatMap((section) => section.products).find((candidate) => candidate.slug === productSlug)
  if (!product) notFound()

  return (
    <div className="container mx-auto px-4 py-8">
      <nav aria-label="Navegação estrutural" className="mb-6 text-sm">
        <Link href={`/delivery-express/restaurant/${restaurant.slug}`} className="underline">
          {restaurant.name}
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          <Image src={product.imageUrl ?? "/placeholder.svg"} alt="" fill className="object-cover" priority />
        </div>

        <div>
          <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>
          {product.description && <p className="mb-4 text-gray-700">{product.description}</p>}
          <p className="mb-6">
            <span className="text-2xl font-bold text-orange-700">{formatCents(product.priceCents)}</span>
            {product.originalPriceCents !== null && product.originalPriceCents > product.priceCents && (
              <span className="ml-2 text-gray-500 line-through">
                <span className="sr-only">de </span>
                {formatCents(product.originalPriceCents)}
              </span>
            )}
          </p>

          <AddToCart
            restaurant={{ id: restaurant.id, slug: restaurant.slug, name: restaurant.name }}
            product={{
              id: product.id,
              name: product.name,
              maxQuantity: product.maxQuantity,
              available: product.available,
              addonGroups: product.addonGroups,
            }}
          />
        </div>
      </div>
    </div>
  )
}
