import Link from "next/link"
import { Button } from "@/components/ui/button"

export function VitrineHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/vitrine" className="flex items-center gap-2">
            <img src="/favicon.png" alt="Logo" className="h-8 w-8" />
            <span className="text-lg font-bold">Vitrine</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/vitrine/contato">Entre em contato</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
