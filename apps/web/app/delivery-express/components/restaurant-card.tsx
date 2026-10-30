import Image from "next/image"
import Link from "next/link"
import type { Restaurant } from "@delivery/contracts"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCents } from "@/lib/utils"

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link href={`/delivery-express/restaurant/${restaurant.slug}`} className="block h-full">
      <Card className="h-full overflow-hidden transition-all hover:shadow-md">
        <div className="relative h-40 w-full bg-gray-100">
          <Image src={restaurant.logoUrl ?? "/placeholder.svg"} alt="" fill className="object-cover" />
          {!restaurant.isOpen && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Badge variant="destructive" className="text-lg font-semibold">
                Fechado
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h2 className="text-xl font-bold">{restaurant.name}</h2>
          {restaurant.description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{restaurant.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {restaurant.deliveryEnabled && (
              <Badge variant="outline" className="bg-green-50">
                Entrega {formatCents(restaurant.deliveryFeeCents)}
              </Badge>
            )}
            {restaurant.pickupEnabled && (
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
