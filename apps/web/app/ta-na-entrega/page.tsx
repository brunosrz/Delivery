import { redirect } from "next/navigation"
import { AccessDenied } from "@/components/auth/access-denied"
import { getSessionUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function TaNaEntregaPage() {
  const user = await getSessionUser()
  if (!user) redirect("/auth/login?callbackUrl=%2Fta-na-entrega")
  if (!["courier", "admin"].includes(user.role)) {
    return <AccessDenied product="Tá na Entrega" requirement="Disponível apenas para entregadores parceiros." />
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Tá na Entrega</h1>
      <p className="text-lg mb-4">Aplicativo para entregadores parceiros gerenciarem suas entregas e ganhos.</p>
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Funcionalidades</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Visualização de pedidos disponíveis</li>
          <li>Aceitação/rejeição de entregas</li>
          <li>Navegação e rotas otimizadas</li>
          <li>Comunicação com clientes e restaurantes</li>
          <li>Registro de entregas realizadas</li>
          <li>Controle de ganhos e pagamentos</li>
          <li>Histórico de atividades</li>
        </ul>
      </div>
    </div>
  )
}
