import Image from "next/image"
import Link from "next/link"
import { AuthStatus } from "@/components/auth/auth-status"

export function EntregaHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/ta-na-entrega" className="flex items-center gap-2">
            <Image src="/favicon.png" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="text-lg font-bold">Tá na Entrega</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <AuthStatus />
        </div>
      </div>
    </header>
  )
}
