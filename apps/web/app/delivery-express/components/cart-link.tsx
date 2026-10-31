"use client"

import Link from "next/link"
import { itemCount } from "@/lib/cart"
import { useCart } from "@/lib/use-cart"

export function CartLink() {
  const [cart] = useCart()
  const count = itemCount(cart)
  return (
    <Link
      href="/delivery-express/cart"
      className="underline"
      aria-label={`Sacola, ${count} ${count === 1 ? "item" : "itens"}`}
    >
      Sacola{count > 0 ? ` (${count})` : ""}
    </Link>
  )
}
