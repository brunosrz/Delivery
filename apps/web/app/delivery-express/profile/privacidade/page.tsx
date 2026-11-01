import { redirect } from "next/navigation"
import { AccessDenied } from "@/components/auth/access-denied"
import { getSessionUser } from "@/lib/session"
import { PrivacyPanel } from "./privacy-panel"

export const dynamic = "force-dynamic"
export const metadata = { title: "Privacidade | Delivery Express" }

export default async function PrivacyPage() {
  const user = await getSessionUser()
  if (!user) redirect("/auth/login?callbackUrl=%2Fdelivery-express%2Fprofile%2Fprivacidade")
  // A exclusão pelo próprio titular vale para contas de cliente; equipe e entregadores saem pelo administrador.
  if (user.role !== "customer") {
    return <AccessDenied product="Delivery Express" requirement="Disponível apenas para contas de cliente." />
  }
  return <PrivacyPanel />
}
