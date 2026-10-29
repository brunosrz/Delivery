import type React from "react"
import { InstitutionalSiteHeader } from "./components/institutional-site-header"

export default function InstitutionalSiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <InstitutionalSiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-white">
        <div className="container py-6 text-center text-sm text-gray-500">
          © 2026 Site institucional do ecossistema Delivery Express. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
