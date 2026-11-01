import type { Metadata, Viewport } from "next"
import type React from "react"
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register"
import { manifestUrl } from "@/lib/pwa"
import { PedidosHeader } from "./components/header"

export const metadata: Metadata = {
  manifest: manifestUrl("pedidos-na-mao"),
  appleWebApp: { capable: true, title: "Pedidos na Mão", statusBarStyle: "default" },
}

export const viewport: Viewport = { themeColor: "#ea580c" }

export default function PedidosNaMaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <ServiceWorkerRegister scope="/pedidos-na-mao/" />
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
