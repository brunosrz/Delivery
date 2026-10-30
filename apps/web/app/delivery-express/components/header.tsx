import Link from "next/link"
import Image from "next/image"
import { AuthStatus } from "@/components/auth/auth-status"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/delivery-express" className="flex items-center gap-2">
          <Image src="/favicon.png" alt="" width={36} height={36} className="rounded-full" />
          <span className="text-xl font-bold">Delivery Express</span>
        </Link>
        <div className="flex items-center gap-4">
          <AuthStatus />
        </div>
      </div>
    </header>
  )
}

// Para manter compatibilidade com código existente
export { Header as DeliveryHeader }
