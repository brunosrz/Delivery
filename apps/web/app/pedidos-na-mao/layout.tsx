import type React from "react"
import { PedidosHeader } from "./components/header"

export default function PedidosNaMaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <PedidosHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-white">
        <div className="container py-6 text-center text-sm text-gray-500">
          © 2026 Pedidos na Mão. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
