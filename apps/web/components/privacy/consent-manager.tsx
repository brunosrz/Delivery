"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocale } from "@/components/locale-provider"
import { type Consent, consentCookie, gpcEnabled, newConsent } from "@/lib/consent"
import { reportConsent } from "@/lib/consent-client"
import { m } from "@/lib/paraglide/messages.js"

export const OPEN_COOKIE_PREFERENCES = "open-cookie-preferences"

/** Botão do rodapé: reabre as preferências, para a pessoa poder mudar ou retirar o consentimento a qualquer hora. */
export function CookiePreferencesButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="underline"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES))}
    >
      {label}
    </button>
  )
}

type Choices = { analytics: boolean; marketing: boolean }
const NONE: Choices = { analytics: false, marketing: false }

// "Rejeitar" e "Aceitar" têm o mesmo peso visual: recusar não pode ser mais difícil nem menos visível que aceitar.
const choiceButton =
  "rounded-md border border-gray-800 bg-white px-4 py-2 font-semibold text-gray-900 hover:bg-gray-100"

export function ConsentManager({ initial }: { initial: Consent | null }) {
  const locale = useLocale()
  const t = (key: keyof typeof m) =>
    (m[key] as (inputs: object, options: { locale: typeof locale }) => string)({}, { locale })
  const [consent, setConsent] = useState<Consent | null>(initial)
  const [open, setOpen] = useState(false)
  const [gpc, setGpc] = useState(false)
  const [draft, setDraft] = useState<Choices>(NONE)
  const dialogRef = useRef<HTMLDivElement>(null)
  const consentRef = useRef(consent)
  consentRef.current = consent

  const save = useCallback(
    (choices: Choices, source: "banner" | "preferences" | "gpc") => {
      const next = newConsent(choices, Date.now(), consentRef.current?.id)
      document.cookie = consentCookie(next, window.location.protocol === "https:")
      setConsent(next)
      setOpen(false)
      void reportConsent(next, source, locale)
    },
    [locale],
  )

  // Sinal Global Privacy Control: vale como recusa. Registra a recusa sozinho e não incomoda com o banner.
  useEffect(() => {
    const enabled = gpcEnabled(navigator as Navigator & { globalPrivacyControl?: boolean })
    setGpc(enabled)
    if (enabled && !consentRef.current) save(NONE, "gpc")
  }, [save])

  useEffect(() => {
    const reopen = () => {
      setDraft({ analytics: consentRef.current?.a ?? false, marketing: consentRef.current?.m ?? false })
      setOpen(true)
    }
    window.addEventListener(OPEN_COOKIE_PREFERENCES, reopen)
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES, reopen)
  }, [])

  useEffect(() => {
    if (!open) return
    dialogRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const toggles: { id: "analytics" | "marketing"; title: keyof typeof m; text: keyof typeof m }[] = [
    { id: "analytics", title: "cookie_analytics_title", text: "cookie_analytics_text" },
    { id: "marketing", title: "cookie_marketing_title", text: "cookie_marketing_text" },
  ]

  return (
    <>
      {!consent && !open && !gpc && (
        <section
          aria-label={t("cookie_banner_label")}
          className="fixed inset-x-0 bottom-0 z-50 border-t bg-white p-4 shadow-lg"
        >
          <div className="container mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl text-sm text-gray-800">
              <p className="font-semibold">{t("cookie_banner_title")}</p>
              <p>{t("cookie_banner_text")}</p>
              <Link href="/legal/cookies" className="underline">
                {t("cookie_banner_policy")}
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={choiceButton} onClick={() => save(NONE, "banner")}>
                {t("cookie_reject_all")}
              </button>
              <button
                type="button"
                className={choiceButton}
                onClick={() => save({ analytics: true, marketing: true }, "banner")}
              >
                {t("cookie_accept_all")}
              </button>
              <button
                type="button"
                className="rounded-md px-4 py-2 font-semibold text-gray-900 underline"
                onClick={() => {
                  setDraft(NONE)
                  setOpen(true)
                }}
              >
                {t("cookie_customize")}
              </button>
            </div>
          </div>
        </section>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-prefs-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 id="cookie-prefs-title" className="mb-4 text-xl font-semibold">
              {t("cookie_prefs_title")}
            </h2>
            {gpc && (
              <p role="status" className="mb-4 rounded bg-amber-50 p-3 text-sm">
                {t("cookie_gpc_notice")}
              </p>
            )}
            <div className="space-y-4">
              <div className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{t("cookie_necessary_title")}</h3>
                  <span className="text-sm text-gray-600">{t("cookie_always_on")}</span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{t("cookie_necessary_text")}</p>
              </div>
              {toggles.map((toggle) => (
                <div key={toggle.id} className="rounded border p-3">
                  <label className="flex items-center justify-between gap-3">
                    <span className="font-medium">{t(toggle.title)}</span>
                    <input
                      type="checkbox"
                      checked={!gpc && draft[toggle.id]}
                      disabled={gpc}
                      onChange={(event) => setDraft({ ...draft, [toggle.id]: event.target.checked })}
                      className="h-5 w-5"
                    />
                  </label>
                  <p className="mt-1 text-sm text-gray-700">{t(toggle.text)}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" className={choiceButton} onClick={() => setOpen(false)}>
                {t("cookie_prefs_close")}
              </button>
              <button
                type="button"
                className={choiceButton}
                onClick={() => save(gpc ? NONE : draft, gpc ? "gpc" : "preferences")}
              >
                {t("cookie_prefs_save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
