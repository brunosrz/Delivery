import Link from "next/link"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="Logo" className="h-8 w-8" />
            <span className="text-lg font-bold">Delivery by Sorz</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/delivery-express" className="text-sm font-medium hover:underline">
              Delivery Express
            </Link>
            <Link href="/vitrine" className="text-sm font-medium hover:underline">
              Vitrine
            </Link>
            <Link href="/ta-na-entrega" className="text-sm font-medium hover:underline">
              Tá na Entrega
            </Link>
            <Link href="/pedidos-na-mao" className="text-sm font-medium hover:underline">
              Pedidos na Mão
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
