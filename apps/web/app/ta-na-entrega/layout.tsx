import type React from "react"
import { EntregaHeader } from "./components/header"

export default function TaNaEntregaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <EntregaHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-white">
        <div className="container py-6 text-center text-sm text-gray-500">
          © 2026 Tá na Entrega. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
