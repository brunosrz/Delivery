import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AccessDenied } from "@/components/auth/access-denied"
import { AutoRefresh } from "@/components/orders/auto-refresh"
import { OrderActions } from "@/components/orders/order-actions"
import { getApiClient } from "@/lib/api"
import { getSessionUser } from "@/lib/session"
import { formatCents } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const metadata = { title: "Tá na Entrega" }

export default async function TaNaEntregaPage() {
  const user = await getSessionUser()
  if (!user) redirect("/auth/login?callbackUrl=%2Fta-na-entrega")
  if (!["courier", "admin"].includes(user.role)) {
    return <AccessDenied product="Tá na Entrega" requirement="Disponível apenas para entregadores parceiros." />
  }

  const result = await getApiClient()?.listCourierOrders({ headers: { cookie: (await cookies()).toString() } })
  if (!result?.ok) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="mb-4 text-3xl font-bold">Tá na Entrega</h1>
        <p role="alert">Não foi possível carregar as entregas agora. Tentando de novo em instantes.</p>
        <AutoRefresh />
      </div>
    )
  }

  const available = result.data.filter((order) => order.status === "ready")
  const inProgress = result.data.filter((order) => order.status === "dispatched")

  const sections = [
    { id: "disponiveis", title: "Disponíveis", orders: available, next: ["dispatched"] },
    { id: "em-curso", title: "Em curso", orders: inProgress, next: ["delivered"] },
  ]

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <AutoRefresh />
      <h1 className="mb-6 text-3xl font-bold">Tá na Entrega</h1>
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={section.id} className="mb-8">
          <h2 id={section.id} className="mb-3 text-xl font-semibold">
            {section.title} ({section.orders.length})
          </h2>
          {section.orders.length === 0 && <p className="text-gray-600">Nenhuma entrega aqui por enquanto.</p>}
          <ul className="space-y-3">
            {section.orders.map((order) => (
              <li key={order.id} className="rounded-lg border p-4">
                <p className="font-medium">
                  Pedido #{order.id.slice(0, 6)} · {formatCents(order.quote.totalCents)}
                </p>
                {order.address && (
                  <p className="text-sm text-gray-700">
                    {order.address.street}, {order.address.number} · {order.address.district}, {order.address.city}
                  </p>
                )}
                <OrderActions orderId={order.id} next={section.next} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
