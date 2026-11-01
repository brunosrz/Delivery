"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { Quote } from "@delivery/contracts"
import { setQuantity, toItems } from "@/lib/cart"
import { requestQuote } from "@/lib/orders-client"
import { useCart } from "@/lib/use-cart"
import { formatCents } from "@/lib/utils"

type QuoteState =
  { status: "idle" } | { status: "loading" } | { status: "ready"; quote: Quote } | { status: "error"; message: string }

export function CartView() {
  const [cart, setCart] = useCart()
  const [state, setState] = useState<QuoteState>({ status: "idle" })

  useEffect(() => {
    if (!cart) return
    let cancelled = false
    setState({ status: "loading" })
    requestQuote({ restaurantId: cart.restaurantId, fulfillment: "delivery", items: toItems(cart) }).then((result) => {
      if (cancelled) return
      if (result.ok) setState({ status: "ready", quote: result.data })
      else setState({ status: "error", message: result.error.message })
    })
    return () => {
      cancelled = true
    }
  }, [cart])

  if (!cart) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">Sua sacola</h1>
        <p>
          A sacola está vazia.{" "}
          <Link href="/delivery-express" className="underline">
            Escolher um restaurante
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Sua sacola</h1>
      <p className="mb-6 text-gray-600">
        <Link href={`/delivery-express/restaurant/${cart.restaurantSlug}`} className="underline">
          {cart.restaurantName}
        </Link>
      </p>

      <ul className="mb-6 space-y-3">
        {cart.lines.map((line, index) => (
          <li key={line.key} className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="font-semibold">{line.productName}</p>
              {line.addonLabels.length > 0 && <p className="text-sm text-gray-600">{line.addonLabels.join(", ")}</p>}
              {line.notes && <p className="text-sm text-gray-600">Obs.: {line.notes}</p>}
              <label className="mt-2 flex items-center gap-2 text-sm">
                Quantidade
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={line.quantity}
                  aria-label={`Quantidade de ${line.productName}`}
                  onChange={(event) => setCart(setQuantity(cart, line.key, Number(event.target.value) || 0))}
                  className="w-20 rounded-md border px-2 py-1"
                />
              </label>
              <button
                type="button"
                onClick={() => setCart(setQuantity(cart, line.key, 0))}
                className="mt-2 text-sm underline"
              >
                Remover
              </button>
            </div>
            <p className="font-medium">
              {state.status === "ready" && cart.lines.length === state.quote.lines.length
                ? formatCents(state.quote.lines[index]?.lineTotalCents ?? 0)
                : ""}
            </p>
          </li>
        ))}
      </ul>

      <div role="status" className="mb-6 rounded-lg border p-4">
        {state.status === "loading" && <p>Calculando…</p>}
        {state.status === "error" && <p className="text-red-700">{state.message}</p>}
        {state.status === "ready" && (
          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatCents(state.quote.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Entrega</dt>
              <dd>{formatCents(state.quote.deliveryCents)}</dd>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <dt>Total</dt>
              <dd>{formatCents(state.quote.totalCents)}</dd>
            </div>
          </dl>
        )}
      </div>

      <Link
        href="/delivery-express/checkout"
        aria-disabled={state.status !== "ready"}
        className="inline-block w-full rounded-md bg-orange-600 px-4 py-3 text-center font-semibold text-white aria-disabled:pointer-events-none aria-disabled:opacity-60"
      >
        Continuar para o pagamento
      </Link>
    </div>
  )
}
