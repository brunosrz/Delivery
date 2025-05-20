import Link from "next/link"
import Image from "next/image"
import { ShoppingCart } from "lucide-react"
import { AuthStatus } from "@/components/auth/auth-status"

export function DeliveryHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/delivery-express" className="flex items-center gap-2">
          <Image src="/favicon.png" alt="Delivery Express" width={36} height={36} className="rounded-full" />
          <span className="text-xl font-bold">Delivery Express</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/delivery-express/cart">
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                0
              </span>
            </div>
          </Link>
          <AuthStatus />
        </div>
      </div>
    </header>
  )
}
