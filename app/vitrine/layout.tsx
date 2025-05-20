import type React from "react"
import { VitrineHeader } from "./components/header"

export default function VitrineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <VitrineHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-white">
        <div className="container py-6 text-center text-sm text-gray-500">
          © 2023 Vitrine by Sorz. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
