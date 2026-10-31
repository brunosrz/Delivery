"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { type CreateOrderRequest, type PaymentMethod, type Quote, isOnlinePayment } from "@delivery/contracts"
import { toItems } from "@/lib/cart"
import { newIdempotencyKey, requestQuote, submitOrder } from "@/lib/orders-client"
import { useCart } from "@/lib/use-cart"
import { formatCents } from "@/lib/utils"

const METHODS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: "pix", label: "Pix (pague agora)", hint: "Você recebe o QR Code ao confirmar." },
  { value: "card", label: "Cartão de crédito ou débito (pague agora)", hint: "Você paga na página segura do Asaas." },
  { value: "cash", label: "Dinheiro na entrega", hint: "" },
  { value: "pix_on_delivery", label: "Pix na entrega", hint: "" },
  { value: "card_on_delivery", label: "Cartão na entrega", hint: "" },
]

const field = "w-full rounded-md border px-3 py-2"

export function CheckoutForm() {
  const router = useRouter()
  const [cart, setCart] = useCart()
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery")
  const [method, setMethod] = useState<PaymentMethod>("pix")
  const [quote, setQuote] = useState<Quote | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Uma chave por tentativa: repetir o envio (clique duplo, falha de rede) nunca cria dois pedidos.
  const attempt = useRef<{ key: string; fingerprint: string } | null>(null)

  useEffect(() => {
    if (!cart) return
    let cancelled = false
    requestQuote({ restaurantId: cart.restaurantId, fulfillment, items: toItems(cart) }).then((result) => {
      if (cancelled) return
      if (result.ok) {
        setQuote(result.data)
        setMessage(null)
      } else setMessage(result.error.message)
    })
    return () => {
      cancelled = true
    }
  }, [cart, fulfillment])

  if (!cart) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>
          Sua sacola está vazia.{" "}
          <Link href="/delivery-express" className="underline">
            Escolher um restaurante
          </Link>
        </p>
      </div>
    )
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cart || !quote || busy) return
    const data = new FormData(event.currentTarget)
    const text = (name: string) => String(data.get(name) ?? "").trim()

    const body: Record<string, unknown> = {
      restaurantId: cart.restaurantId,
      fulfillment,
      items: toItems(cart),
      paymentMethod: method,
      expectedTotalCents: quote.totalCents,
    }
    if (fulfillment === "delivery") {
      body.address = {
        street: text("street"),
        number: text("number"),
        ...(text("complement") ? { complement: text("complement") } : {}),
        district: text("district"),
        city: text("city"),
        state: text("state").toUpperCase(),
        postalCode: text("postalCode"),
      }
    }
    if (isOnlinePayment(method)) {
      body.payer = {
        name: text("payerName"),
        cpfCnpj: text("cpfCnpj"),
        ...(text("payerEmail") ? { email: text("payerEmail") } : {}),
        ...(text("payerPhone") ? { mobilePhone: text("payerPhone") } : {}),
      }
    }

    // Corpo diferente = pedido diferente = chave nova (o servidor recusa a mesma chave com outro corpo).
    const fingerprint = JSON.stringify(body)
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { key: newIdempotencyKey(), fingerprint }

    setBusy(true)
    setMessage(null)
    const result = await submitOrder(body as CreateOrderRequest, attempt.current.key)
    setBusy(false)

    if (result.ok) {
      setCart(null)
      router.push(`/delivery-express/orders/${result.data.id}`)
      return
    }
    if (result.error.code === "conflict") {
      // O total mudou no servidor: busca a cotação nova e pede para o cliente conferir.
      attempt.current = null
      const fresh = await requestQuote({ restaurantId: cart.restaurantId, fulfillment, items: toItems(cart) })
      if (fresh.ok) setQuote(fresh.data)
      setMessage("O total do pedido mudou. Confira o novo valor e confirme de novo.")
      return
    }
    const fields = result.error.fields ? Object.values(result.error.fields).flat().join(" ") : ""
    setMessage(fields ? `${result.error.message}: ${fields}` : result.error.message)
  }

  return (
    <form onSubmit={submit} className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Finalizar pedido</h1>

      <fieldset className="mb-6">
        <legend className="mb-2 font-semibold">Como você quer receber?</legend>
        <label className="mr-6">
          <input
            type="radio"
            name="fulfillment"
            checked={fulfillment === "delivery"}
            onChange={() => setFulfillment("delivery")}
          />{" "}
          Entrega
        </label>
        <label>
          <input
            type="radio"
            name="fulfillment"
            checked={fulfillment === "pickup"}
            onChange={() => setFulfillment("pickup")}
          />{" "}
          Retirada
        </label>
      </fieldset>

      {fulfillment === "delivery" && (
        <fieldset className="mb-6 grid grid-cols-6 gap-3">
          <legend className="mb-2 font-semibold">Endereço de entrega</legend>
          <label className="col-span-4">
            Rua
            <input name="street" required autoComplete="address-line1" className={field} />
          </label>
          <label className="col-span-2">
            Número
            <input name="number" required className={field} />
          </label>
          <label className="col-span-6">
            Complemento (opcional)
            <input name="complement" autoComplete="address-line2" className={field} />
          </label>
          <label className="col-span-3">
            Bairro
            <input name="district" required className={field} />
          </label>
          <label className="col-span-3">
            Cidade
            <input name="city" required autoComplete="address-level2" className={field} />
          </label>
          <label className="col-span-2">
            UF
            <input name="state" required maxLength={2} autoComplete="address-level1" className={field} />
          </label>
          <label className="col-span-4">
            CEP
            <input
              name="postalCode"
              required
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              className={field}
            />
          </label>
        </fieldset>
      )}

      <fieldset className="mb-6">
        <legend className="mb-2 font-semibold">Pagamento</legend>
        <ul className="space-y-2">
          {METHODS.map((option) => (
            <li key={option.value}>
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={method === option.value}
                  onChange={() => setMethod(option.value)}
                  className="mt-1"
                />
                <span>
                  {option.label}
                  {option.hint && <span className="block text-sm text-gray-600">{option.hint}</span>}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {isOnlinePayment(method) && (
        <fieldset className="mb-6 grid grid-cols-2 gap-3">
          <legend className="mb-2 font-semibold">Dados de quem paga</legend>
          <label className="col-span-2">
            Nome completo
            <input name="payerName" required autoComplete="name" className={field} />
          </label>
          <label>
            CPF ou CNPJ
            <input name="cpfCnpj" required inputMode="numeric" className={field} />
          </label>
          <label>
            Celular (opcional)
            <input name="payerPhone" inputMode="tel" autoComplete="tel" className={field} />
          </label>
          <label className="col-span-2">
            E-mail (opcional)
            <input name="payerEmail" type="email" autoComplete="email" className={field} />
          </label>
          <p className="col-span-2 text-sm text-gray-600">
            Usamos esses dados só para emitir a cobrança no Asaas; não guardamos o CPF.
          </p>
        </fieldset>
      )}

      <div role="status" className="mb-4 rounded-lg border p-4">
        {quote ? (
          <p className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCents(quote.totalCents)}</span>
          </p>
        ) : (
          <p>Calculando…</p>
        )}
      </div>
      {message && (
        <p role="alert" className="mb-4 text-red-700">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={!quote || busy}
        className="w-full rounded-md bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Enviando…" : "Confirmar pedido"}
      </button>
    </form>
  )
}
