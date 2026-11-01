"use client"

import { useRouter } from "next/navigation"
import { useLocale } from "@/components/locale-provider"
import { LOCALES, type Locale, localeCookie } from "@/lib/locale"
import { m } from "@/lib/paraglide/messages.js"

export function LocaleSwitcher() {
  const router = useRouter()
  const locale = useLocale()

  function change(next: Locale) {
    document.cookie = localeCookie(next, window.location.protocol === "https:")
    router.refresh()
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span>{m.locale_label({}, { locale })}</span>
      <select
        value={locale}
        onChange={(event) => change(event.target.value as Locale)}
        className="rounded border bg-white px-2 py-1"
      >
        {LOCALES.map((option) => (
          <option key={option} value={option}>
            {option === "en" ? m.locale_name_en({}, { locale }) : m.locale_name_pt_br({}, { locale })}
          </option>
        ))}
      </select>
    </label>
  )
}
