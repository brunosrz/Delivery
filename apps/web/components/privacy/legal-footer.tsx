import Link from "next/link"
import { CookiePreferencesButton } from "@/components/privacy/consent-manager"
import { LocaleSwitcher } from "@/components/privacy/locale-switcher"
import type { Locale } from "@/lib/locale"
import { m } from "@/lib/paraglide/messages.js"

/** Rodapé legal presente em todas as páginas: termos, privacidade, cookies, preferências e idioma. */
export function LegalFooter({ locale }: { locale: Locale }) {
  return (
    <footer aria-label={m.legal_footer_label({}, { locale })} className="border-t bg-white">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-gray-700">
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/legal/termos" className="underline">
            {m.legal_terms({}, { locale })}
          </Link>
          <Link href="/legal/privacidade" className="underline">
            {m.legal_privacy({}, { locale })}
          </Link>
          <Link href="/legal/cookies" className="underline">
            {m.legal_cookies({}, { locale })}
          </Link>
          <CookiePreferencesButton label={m.legal_cookie_preferences({}, { locale })} />
        </nav>
        <LocaleSwitcher />
      </div>
    </footer>
  )
}
