import { createServerSupabaseClient } from "@/lib/supabase-server"
import { RestaurantCard } from "./components/restaurant-card"

// O catálogo muda a cada cadastro: renderizar por requisição em vez de congelar no build.
export const dynamic = "force-dynamic"

async function getRestaurants() {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("priority", { ascending: false })
      .order("name")

    if (error) {
      console.error("Erro ao buscar restaurantes:", error.message)
      return { restaurants: [], unavailable: true }
    }

    return { restaurants: data ?? [], unavailable: false }
  } catch (error) {
    console.error("Catálogo indisponível:", error instanceof Error ? error.message : error)
    return { restaurants: [], unavailable: true }
  }
}

export default async function DeliveryExpressPage() {
  const { restaurants, unavailable } = await getRestaurants()

  if (unavailable) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Delivery Express</h1>
        <div role="alert" className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Catálogo indisponível</h2>
          <p className="text-gray-500">Não foi possível carregar os restaurantes agora. Tente novamente mais tarde.</p>
        </div>
      </div>
    )
  }

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
              isOpen={restaurant.is_open ?? undefined}
              deliveryEnabled={restaurant.delivery_enabled ?? undefined}
              pickupEnabled={restaurant.pickup_enabled ?? undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Nenhum restaurante disponível</h2>
          <p className="text-gray-500 mb-6">Não encontramos restaurantes cadastrados no sistema.</p>
          <p className="text-sm text-gray-500">
            O cadastro de restaurantes é feito pela equipe de operação do ecossistema.
          </p>
        </div>
      )}
    </div>
  )
}
