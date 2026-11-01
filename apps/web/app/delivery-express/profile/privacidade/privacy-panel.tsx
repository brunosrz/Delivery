"use client"

import { useState } from "react"
import { DELETE_ACCOUNT_CONFIRMATION, deleteAccount, exportFilename, fetchAccountExport } from "@/lib/account-client"

export function PrivacyPanel() {
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [confirm, setConfirm] = useState("")

  async function download() {
    setBusy(true)
    setMessage(null)
    const result = await fetchAccountExport()
    setBusy(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    const url = URL.createObjectURL(new Blob([result.data], { type: "application/json" }))
    const link = document.createElement("a")
    link.href = url
    link.download = exportFilename()
    link.click()
    URL.revokeObjectURL(url)
  }

  async function remove(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    const result = await deleteAccount(confirm)
    setBusy(false)
    if (result.ok) setDeleted(true)
    else setMessage(result.message)
  }

  if (deleted) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-4 text-3xl font-bold">Conta excluída</h1>
        <p role="status">
          Seus dados pessoais foram anonimizados e você foi desconectado. Os pedidos anteriores ficam guardados sem
          vínculo com você, por obrigação fiscal e financeira.
        </p>
        <a href="/" className="mt-4 inline-block font-semibold text-orange-700 underline">
          Voltar ao início
        </a>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Privacidade e dados pessoais</h1>

      <section aria-labelledby="exportar" className="mb-8 rounded-lg border p-4">
        <h2 id="exportar" className="mb-2 text-xl font-semibold">
          Baixar meus dados
        </h2>
        <p className="mb-3 text-sm text-gray-700">
          Uma cópia dos dados da sua conta e de todos os seus pedidos, em JSON. Não inclui senha nem sessões.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={download}
          className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          Baixar cópia
        </button>
      </section>

      <section aria-labelledby="excluir" className="rounded-lg border border-red-300 p-4">
        <h2 id="excluir" className="mb-2 text-xl font-semibold text-red-700">
          Excluir minha conta
        </h2>
        <p className="mb-3 text-sm text-gray-700">
          Seu nome, e-mail e acesso são removidos e não dá para desfazer. Os pedidos ficam guardados sem vínculo com
          você (obrigação fiscal e financeira) e o endereço de entrega é apagado. Não é possível excluir com pedido em
          andamento.
        </p>
        <form onSubmit={remove} className="space-y-3">
          <label className="block text-sm">
            Para confirmar, digite <strong>{DELETE_ACCOUNT_CONFIRMATION}</strong>
            <input
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={busy || confirm !== DELETE_ACCOUNT_CONFIRMATION}
            className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            Excluir minha conta
          </button>
        </form>
      </section>

      {message && (
        <p role="alert" className="mt-4 text-red-700">
          {message}
        </p>
      )}
    </div>
  )
}
