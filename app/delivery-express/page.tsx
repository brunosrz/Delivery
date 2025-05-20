import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { RestaurantCard } from "./components/restaurant-card"

// Função para buscar restaurantes
async function getRestaurants() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("priority", { ascending: false })
    .order("name")

  if (error) {
    console.error("Erro ao buscar restaurantes:", error)
    return []
  }

  return data || []
}

export default async function DeliveryExpressPage() {
  const restaurants = await getRestaurants()

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Delivery Express</h1>

      {restaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              id={restaurant.id}
              name={restaurant.name}
              slug={restaurant.restaurant_slug}
              logoUrl={restaurant.logo_url || undefined}
              description={restaurant.description || undefined}
              isOpen={restaurant.is_open}
              deliveryEnabled={restaurant.delivery_enabled}
              pickupEnabled={restaurant.pickup_enabled}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Nenhum restaurante disponível</h2>
          <p className="text-gray-500 mb-6">Não encontramos restaurantes cadastrados no sistema.</p>
          <Link
            href="/administrativo"
            className="inline-block bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
          >
            Ir para o Administrativo
          </Link>
        </div>
      )}
    </div>
  )
}
