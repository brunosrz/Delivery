"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RestaurantCardProps {
  id: string
  name: string
  slug: string
  logoUrl?: string
  description?: string
  isOpen?: boolean
  deliveryEnabled?: boolean
  pickupEnabled?: boolean
}

export function RestaurantCard({
  name,
  slug,
  logoUrl,
  description,
  isOpen = true,
  deliveryEnabled = true,
  pickupEnabled = true,
}: RestaurantCardProps) {
  return (
    <Link href={`/delivery-express/restaurant/${slug}`}>
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <div className="relative h-40 w-full bg-gray-100">
          <Image
            src={logoUrl || "/placeholder.svg?height=160&width=320&query=restaurant logo"}
            alt={name}
            fill
            className="object-cover"
          />
          {!isOpen && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Badge variant="destructive" className="text-lg font-semibold">
                Fechado
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="text-xl font-bold">{name}</h3>
          {description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {deliveryEnabled && (
              <Badge variant="outline" className="bg-green-50">
                Delivery
              </Badge>
            )}
            {pickupEnabled && (
              <Badge variant="outline" className="bg-blue-50">
                Retirada
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
