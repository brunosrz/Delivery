import Image from "next/image"
import Link from "next/link"

export function InstitutionalSiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/site-institucional" className="flex items-center gap-2">
            <Image src="/favicon.png" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="text-lg font-bold">Delivery Express</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
