"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { requestPayment } from "@/lib/orders-client"

/** A cobrança online não foi emitida (ex.: Asaas fora do ar na hora do pedido). Repetir é seguro: a emissão é idempotente. */
export function PaymentRetry({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = (name: string) => String(data.get(name) ?? "").trim()
    setBusy(true)
    setMessage(null)
    const result = await requestPayment(orderId, {
      name: text("payerName"),
      cpfCnpj: text("cpfCnpj"),
      ...(text("payerEmail") ? { email: text("payerEmail") } : {}),
    })
    setBusy(false)
    if (result.ok) router.refresh()
    else setMessage(result.error.message)
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <p>Não conseguimos gerar a cobrança. Confirme seus dados para tentar de novo.</p>
      <label className="block">
        Nome completo
        <input name="payerName" required autoComplete="name" className="w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block">
        CPF ou CNPJ
        <input name="cpfCnpj" required inputMode="numeric" className="w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block">
        E-mail (opcional)
        <input name="payerEmail" type="email" autoComplete="email" className="w-full rounded-md border px-3 py-2" />
      </label>
      {message && (
        <p role="alert" className="text-red-700">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Gerando…" : "Gerar cobrança"}
      </button>
    </form>
  )
}
