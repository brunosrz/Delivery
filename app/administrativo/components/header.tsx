import Link from "next/link"
import { AuthStatus } from "@/components/auth/auth-status"

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/administrativo" className="flex items-center gap-2">
            <img src="/favicon.png" alt="Logo" className="h-8 w-8" />
            <span className="text-lg font-bold">Administrativo</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <AuthStatus />
        </div>
      </div>
    </header>
  )
}
