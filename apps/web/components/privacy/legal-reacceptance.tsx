"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useLocale } from "@/components/locale-provider"
import { acceptLegalDocuments } from "@/lib/legal-client"
import { m } from "@/lib/paraglide/messages.js"

/** Pede novo aceite quando os Termos ou a Política mudaram desde o último aceite do usuário logado. */
export function LegalReacceptance() {
  const locale = useLocale()
  const options = { locale }
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function accept() {
    setBusy(true)
    setFailed(false)
    const ok = await acceptLegalDocuments()
    setBusy(false)
    if (ok) router.refresh()
    else setFailed(true)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-update-title"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id="legal-update-title" className="mb-2 text-xl font-semibold">
          {m.legal_update_title({}, options)}
        </h2>
        <p className="mb-3 text-sm text-gray-700">{m.legal_update_text({}, options)}</p>
        <p className="mb-4 flex flex-wrap gap-x-4 text-sm">
          <Link href="/legal/termos" target="_blank" className="underline">
            {m.legal_terms({}, options)}
          </Link>
          <Link href="/legal/privacidade" target="_blank" className="underline">
            {m.legal_privacy({}, options)}
          </Link>
        </p>
        {failed && (
          <p role="alert" className="mb-3 text-sm text-red-700">
            {m.privacy_error_generic({}, options)}
          </p>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={accept}
          className="w-full rounded-md bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {m.legal_update_accept({}, options)}
        </button>
      </div>
    </div>
  )
}
