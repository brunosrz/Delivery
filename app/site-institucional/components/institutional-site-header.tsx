import Link from "next/link"
import { Button } from "@/components/ui/button"

export function InstitutionalSiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/site-institucional" className="flex items-center gap-2">
            <img src="/favicon.png" alt="Logo" className="h-8 w-8" />
            <span className="text-lg font-bold">Delivery Express</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/site-institucional/contato">Entre em contato</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
