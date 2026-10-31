"use client"

import { useState } from "react"

type State = { status: "idle" } | { status: "sending" } | { status: "sent" } | { status: "error"; message: string }

const field = "mt-1 w-full rounded-md border px-3 py-2"

export function ContactForm() {
  const [state, setState] = useState<State>({ status: "idle" })

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = (name: string) => String(data.get(name) ?? "")
    setState({ status: "sending" })
    try {
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: text("name"),
          email: text("email"),
          message: text("message"),
          // Armadilha para robôs: o campo fica escondido e pessoas nunca o preenchem.
          website: text("website"),
        }),
      })
      if (response.ok) {
        setState({ status: "sent" })
        return
      }
      const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
      setState({ status: "error", message: body?.error?.message ?? "Não foi possível enviar agora." })
    } catch {
      setState({ status: "error", message: "Sem conexão com o servidor. Tente de novo." })
    }
  }

  if (state.status === "sent") {
    return (
      <p role="status" className="rounded-lg border p-4">
        Mensagem enviada. Obrigado pelo contato!
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        Nome
        <input name="name" required minLength={2} maxLength={120} autoComplete="name" className={field} />
      </label>
      <label className="block">
        E-mail
        <input name="email" type="email" required maxLength={200} autoComplete="email" className={field} />
      </label>
      <label className="block">
        Mensagem
        <textarea name="message" required minLength={10} maxLength={2000} rows={5} className={field} />
      </label>
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label>
          Não preencha este campo
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-red-700">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={state.status === "sending"}
        className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {state.status === "sending" ? "Enviando…" : "Enviar mensagem"}
      </button>
    </form>
  )
}
