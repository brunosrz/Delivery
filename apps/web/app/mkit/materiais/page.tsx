import { redirect } from "next/navigation"
import { AccessDenied } from "@/components/auth/access-denied"
import { getSessionUser } from "@/lib/session"
import { MaterialsPanel } from "./materials-panel"

export const dynamic = "force-dynamic"
export const metadata = { title: "Materiais | MKit" }

export default async function MkitMaterialsPage() {
  const user = await getSessionUser()
  if (!user) redirect("/auth/login?callbackUrl=%2Fmkit%2Fmateriais")
  if (!["restaurant_staff", "admin"].includes(user.role)) {
    return <AccessDenied product="MKit" requirement="Disponível apenas para a equipe de restaurantes parceiros." />
  }
  const restaurantId = user.restaurantIds[0]
  if (!restaurantId) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="mb-4 text-3xl font-bold">Materiais do MKit</h1>
        <p role="status">Sua conta ainda não está vinculada a um restaurante.</p>
      </div>
    )
  }
  return <MaterialsPanel restaurantId={restaurantId} />
}
