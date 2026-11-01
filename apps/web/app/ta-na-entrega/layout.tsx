import type { Metadata, Viewport } from "next"
import type React from "react"
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register"
import { manifestUrl } from "@/lib/pwa"
import { EntregaHeader } from "./components/header"

export const metadata: Metadata = {
  manifest: manifestUrl("ta-na-entrega"),
  appleWebApp: { capable: true, title: "Tá na Entrega", statusBarStyle: "default" },
}

export const viewport: Viewport = { themeColor: "#15803d" }

export default function TaNaEntregaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <ServiceWorkerRegister scope="/ta-na-entrega/" />
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
