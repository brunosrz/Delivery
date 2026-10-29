"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProductCardProps {
  id: string
  title: string
  slug: string
  description?: string
  price: number
  imageUrl?: string
  originalPrice?: number
  discountPercentage?: number
  featured?: boolean
  restaurantSlug: string
}

export function ProductCard({
  id,
  title,
  slug,
  description,
  price,
  imageUrl,
  originalPrice,
  discountPercentage,
  featured,
  restaurantSlug,
}: ProductCardProps) {
  const formattedPrice = price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  const formattedOriginalPrice = originalPrice?.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  return (
    <Link href={`/delivery-express/restaurant/${restaurantSlug}/product/${slug}`}>
      <Card className="h-full overflow-hidden transition-all hover:shadow-md">
        <div className="relative h-40 w-full bg-gray-100">
          <Image
            src={imageUrl || "/placeholder.svg?height=160&width=320&query=food"}
            alt={title}
            fill
            className="object-cover"
          />
          {discountPercentage && <Badge className="absolute left-2 top-2 bg-red-500">{discountPercentage}% OFF</Badge>}
          {featured && <Badge className="absolute right-2 top-2 bg-amber-500">Destaque</Badge>}
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold">{title}</h3>
          {description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>}
          <div className="mt-2">
            <span className="text-lg font-bold text-orange-600">{formattedPrice}</span>
            {originalPrice && <span className="ml-2 text-sm text-gray-500 line-through">{formattedOriginalPrice}</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
