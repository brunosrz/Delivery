import { getApiClient } from "@/lib/api"
import { CatalogUnavailable } from "./catalog-unavailable"
import { RestaurantCard } from "./components/restaurant-card"

// O catálogo muda a cada cadastro: renderizar por requisição em vez de congelar no build.
export const dynamic = "force-dynamic"

export default async function DeliveryExpressPage() {
  const result = await getApiClient()?.listRestaurants()
  if (!result?.ok) return <CatalogUnavailable title="Delivery Express" />

  const restaurants = result.data

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Delivery Express</h1>

      {restaurants.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id}>
              <RestaurantCard restaurant={restaurant} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Nenhum restaurante disponível</h2>
          <p className="text-gray-600">O cadastro de restaurantes é feito pela equipe de operação do ecossistema.</p>
        </div>
      )}
    </div>
  )
}
