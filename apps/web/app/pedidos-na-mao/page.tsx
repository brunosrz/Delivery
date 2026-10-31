import { redirect } from "next/navigation"
import { AccessDenied } from "@/components/auth/access-denied"
import { getSessionUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function PedidosNaMaoPage() {
  const user = await getSessionUser()
  if (!user) redirect("/auth/login?callbackUrl=%2Fpedidos-na-mao")
  if (!["restaurant_staff", "admin"].includes(user.role)) {
    return (
      <AccessDenied product="Pedidos na Mão" requirement="Disponível apenas para a equipe de restaurantes parceiros." />
    )
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Pedidos na Mão</h1>
      <p className="text-lg mb-4">Sistema para restaurantes gerenciarem seus pedidos, cardápios e operações diárias.</p>
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Funcionalidades</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Painel de controle de pedidos</li>
          <li>Gerenciamento de cardápio</li>
          <li>Controle de estoque</li>
          <li>Gestão de entregadores</li>
          <li>Relatórios de vendas</li>
          <li>Configuração de horários de funcionamento</li>
          <li>Gestão de promoções e cupons</li>
        </ul>
      </div>
    </div>
  )
}
