import type React from "react"
import { AuthProvider } from "@/components/auth/auth-provider"
import { AdminHeader } from "./components/header"

export default function AdministrativoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t bg-white">
          <div className="container py-6 text-center text-sm text-gray-500">
            © 2023 Administrativo by Sorz. Todos os direitos reservados.
          </div>
        </footer>
      </div>
    </AuthProvider>
  )
}
