"use client"

import Link from "next/link"
import { useState } from "react"
import { useLocale } from "@/components/locale-provider"
import { OPEN_COOKIE_PREFERENCES } from "@/components/privacy/consent-manager"
import { DELETE_ACCOUNT_CONFIRMATION, deleteAccount, exportFilename, fetchAccountExport } from "@/lib/account-client"
import { m } from "@/lib/paraglide/messages.js"

/** Mensagem no idioma da pessoa a partir do status HTTP; o texto do servidor não é traduzido. */
function failureText(status: number, locale: "pt-BR" | "en"): string {
  const options = { locale }
  if (status === 0) return m.privacy_error_offline({}, options)
  if (status === 401) return m.privacy_error_reauth({}, options)
  if (status === 403) return m.privacy_error_role({}, options)
  if (status === 409) return m.privacy_error_open_orders({}, options)
  if (status === 429) return m.privacy_error_rate({}, options)
  return m.privacy_error_generic({}, options)
}

export function PrivacyPanel() {
  const locale = useLocale()
  const options = { locale }
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
      setMessage(failureText(result.status, locale))
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
    else setMessage(failureText(result.status, locale))
  }

  if (deleted) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-4 text-3xl font-bold">{m.privacy_deleted_title({}, options)}</h1>
        <p role="status">{m.privacy_deleted_text({}, options)}</p>
        <Link href="/" className="mt-4 inline-block font-semibold text-orange-700 underline">
          {m.privacy_back_home({}, options)}
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">{m.privacy_title({}, options)}</h1>

      <section aria-labelledby="exportar" className="mb-8 rounded-lg border p-4">
        <h2 id="exportar" className="mb-2 text-xl font-semibold">
          {m.privacy_export_title({}, options)}
        </h2>
        <p className="mb-3 text-sm text-gray-700">{m.privacy_export_text({}, options)}</p>
        <button
          type="button"
          disabled={busy}
          onClick={download}
          className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {m.privacy_export_button({}, options)}
        </button>
      </section>

      <section aria-labelledby="cookies" className="mb-8 rounded-lg border p-4">
        <h2 id="cookies" className="mb-2 text-xl font-semibold">
          {m.legal_cookie_preferences({}, options)}
        </h2>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES))}
          className="rounded-md border px-4 py-2 font-semibold"
        >
          {m.privacy_cookie_prefs_link({}, options)}
        </button>
      </section>

      <section aria-labelledby="excluir" className="rounded-lg border border-red-300 p-4">
        <h2 id="excluir" className="mb-2 text-xl font-semibold text-red-700">
          {m.privacy_delete_title({}, options)}
        </h2>
        <p className="mb-3 text-sm text-gray-700">{m.privacy_delete_text({}, options)}</p>
        <form onSubmit={remove} className="space-y-3">
          <label className="block text-sm">
            {m.privacy_confirm_label({ phrase: DELETE_ACCOUNT_CONFIRMATION }, options)}
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
            {m.privacy_delete_button({}, options)}
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
