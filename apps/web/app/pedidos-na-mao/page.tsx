import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AccessDenied } from "@/components/auth/access-denied"
import { getApiClient } from "@/lib/api"
import { QUEUE_COLUMNS, groupByStatus, nextActions } from "@/lib/restaurant-queue"
import { getSessionUser } from "@/lib/session"
import { formatCents } from "@/lib/utils"
import { AutoRefresh } from "@/components/orders/auto-refresh"
import { OrderActions } from "@/components/orders/order-actions"

export const dynamic = "force-dynamic"
export const metadata = { title: "Pedidos na Mão" }

const PAYMENT_LABEL = {
  pending: "pagamento pendente",
  paid: "pago",
  failed: "pagamento falhou",
  refunded: "reembolsado",
}

export default async function PedidosNaMaoPage() {
  const user = await getSessionUser()
  if (!user) redirect("/auth/login?callbackUrl=%2Fpedidos-na-mao")
  if (!["restaurant_staff", "admin"].includes(user.role)) {
    return (
      <AccessDenied product="Pedidos na Mão" requirement="Disponível apenas para a equipe de restaurantes parceiros." />
    )
  }

  const restaurantId = user.restaurantIds[0]
  if (!restaurantId) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="mb-4 text-3xl font-bold">Pedidos na Mão</h1>
        <p role="status">Sua conta ainda não está vinculada a um restaurante.</p>
      </div>
    )
  }

  const client = getApiClient()
  const result = await client?.listRestaurantOrders(restaurantId, { headers: { cookie: (await cookies()).toString() } })
  if (!result?.ok) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="mb-4 text-3xl font-bold">Pedidos na Mão</h1>
        <p role="alert">Não foi possível carregar a fila agora. Tentando de novo em instantes.</p>
        <AutoRefresh />
      </div>
    )
  }

  const groups = groupByStatus(result.data)

  return (
    <div className="container mx-auto px-4 py-10">
      <AutoRefresh />
      <h1 className="mb-6 text-3xl font-bold">Pedidos na Mão</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {QUEUE_COLUMNS.map((column) => {
          const orders = groups.get(column.status) ?? []
          return (
            <section key={column.status} aria-labelledby={`col-${column.status}`} className="rounded-lg border p-3">
              <h2 id={`col-${column.status}`} className="mb-3 font-semibold">
                {column.title} ({orders.length})
              </h2>
              <ul className="space-y-3">
                {orders.map((order) => (
                  <li key={order.id} className="rounded-md border p-3">
                    <p className="font-medium">
                      #{order.id.slice(0, 6)} · {order.fulfillment === "pickup" ? "Retirada" : "Entrega"}
                    </p>
                    <ul className="text-sm text-gray-700">
                      {order.quote.lines.map((line, index) => (
                        <li key={`${line.productId}-${index}`}>
                          {line.quantity}× {line.name}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-sm">
                      {formatCents(order.quote.totalCents)} · {PAYMENT_LABEL[order.payment.status]}
                    </p>
                    <OrderActions orderId={order.id} next={nextActions(order.status, order.fulfillment)} />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
