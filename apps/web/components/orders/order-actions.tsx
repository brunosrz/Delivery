"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

const LABEL: Record<string, string> = {
  accepted: "Aceitar",
  preparing: "Iniciar preparo",
  ready: "Marcar como pronto",
  dispatched: "Peguei a entrega",
  delivered: "Marcar como entregue",
  cancelled: "Cancelar",
}

/** Botões das próximas transições permitidas ao restaurante. O servidor valida de novo papel, vínculo e estado. */
export function OrderActions({ orderId, next }: { orderId: string; next: string[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function move(to: string) {
    setBusy(to)
    setMessage(null)
    try {
      const response = await fetch(`/api/v1/orders/${encodeURIComponent(orderId)}/transitions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
        setMessage(body?.error?.message ?? "Não foi possível mudar o status.")
      }
    } catch {
      setMessage("Sem conexão com o servidor.")
    } finally {
      setBusy(null)
      router.refresh()
    }
  }

  if (next.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {next.map((to) => (
        <button
          key={to}
          type="button"
          disabled={busy !== null}
          onClick={() => move(to)}
          className={`rounded-md px-3 py-1 text-sm font-medium disabled:opacity-60 ${
            to === "cancelled" ? "border text-red-700" : "bg-orange-600 text-white"
          }`}
        >
          {busy === to ? "Enviando…" : (LABEL[to] ?? to)}
        </button>
      ))}
      {message && (
        <span role="alert" className="text-sm text-red-700">
          {message}
        </span>
      )}
    </div>
  )
}
