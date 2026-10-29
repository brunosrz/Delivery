import type React from "react"
import { DeliveryHeader } from "./components/header"
import { AuthProvider } from "@/components/auth/auth-provider"

export default function DeliveryExpressLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <DeliveryHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t bg-white">
          <div className="container py-6 text-center text-sm text-gray-500">
            © 2026 Delivery Express. Todos os direitos reservados.
          </div>
        </footer>
      </div>
    </AuthProvider>
  )
}
