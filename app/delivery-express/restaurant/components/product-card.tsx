import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface ProductCardProps {
  id: string
  title: string
  description?: string | null
  price: number
  image_url?: string | null
  product_slug: string
  restaurant_slug: string
  original_price?: number | null
}

export function ProductCard({
  id,
  title,
  description,
  price,
  image_url,
  product_slug,
  restaurant_slug,
  original_price,
}: ProductCardProps) {
  const discount = original_price ? Math.round(((original_price - price) / original_price) * 100) : 0

  return (
    <Link href={`/delivery-express/restaurant/${restaurant_slug}/product/${product_slug}`}>
      <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-md">
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          {image_url ? (
            <Image
              src={image_url || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200">
              <span className="text-gray-400">Sem imagem</span>
            </div>
          )}

          {discount > 0 && (
            <div className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
              {discount}% OFF
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="mb-1 font-bold">{title}</h3>

          {description && <p className="mb-2 line-clamp-2 text-sm text-gray-600">{description}</p>}

          <div className="flex items-center gap-2">
            <span className="font-bold text-green-600">{formatCurrency(price)}</span>

            {original_price && original_price > price && (
              <span className="text-sm text-gray-400 line-through">{formatCurrency(original_price)}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
