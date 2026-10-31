import Image from "next/image"
import Link from "next/link"
import type { Product } from "@delivery/contracts"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCents } from "@/lib/utils"

export function ProductCard({ product, restaurantSlug }: { product: Product; restaurantSlug: string }) {
  const onSale = product.originalPriceCents !== null && product.originalPriceCents > product.priceCents

  return (
    <Link href={`/delivery-express/restaurant/${restaurantSlug}/product/${product.slug}`} className="block h-full">
      <Card className="h-full overflow-hidden transition-all hover:shadow-md">
        <div className="relative h-40 w-full bg-gray-100">
          <Image src={product.imageUrl ?? "/placeholder.svg"} alt="" fill className="object-cover" />
          {!product.available && (
            <Badge variant="destructive" className="absolute right-2 top-2">
              Indisponível
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold">{product.name}</h3>
          {product.description && <p className="mt-1 text-sm text-gray-600 line-clamp-2">{product.description}</p>}
          <p className="mt-2">
            <span className="text-lg font-bold text-orange-700">{formatCents(product.priceCents)}</span>
            {onSale && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                <span className="sr-only">de </span>
                {formatCents(product.originalPriceCents ?? 0)}
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
