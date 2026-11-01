import Link from "next/link"
import { notFound } from "next/navigation"
import { getRequestLocale } from "@/lib/locale-server"
import { type LegalKind, getLegalDocument, legalVersion } from "@/lib/legal"
import { isPlausibleEmail, readController } from "@/lib/legal/config"
import type { Block } from "@/lib/legal/types"
import { m } from "@/lib/paraglide/messages.js"

export const dynamic = "force-dynamic"

// O endereço fica em português (a base do produto); o conteúdo muda com o idioma escolhido.
const KIND_BY_SLUG: Record<string, LegalKind> = { termos: "terms", privacidade: "privacy", cookies: "cookies" }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const kind = KIND_BY_SLUG[(await params).slug]
  if (!kind) return {}
  return { title: getLegalDocument(kind, await getRequestLocale()).title }
}

function renderBlock(block: Block, index: number) {
  if ("p" in block) return <p key={index}>{block.p}</p>
  if ("ul" in block) {
    return (
      <ul key={index} className="list-disc space-y-1 pl-6">
        {block.ul.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  return (
    <div key={index} className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            {block.table.head.map((cell) => (
              <th key={cell} scope="col" className="border-b-2 px-2 py-1 font-semibold">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.table.rows.map((row) => (
            <tr key={row.join("|")}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border-b px-2 py-1 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const kind = KIND_BY_SLUG[(await params).slug]
  if (!kind) notFound()

  const locale = await getRequestLocale()
  const document = getLegalDocument(kind, locale)
  const version = legalVersion(kind)
  const controller = readController()
  const email = isPlausibleEmail(controller.privacyEmail) ? controller.privacyEmail : null
  const configured = Boolean(controller.name && email)

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm underline">
        {m.legal_back({}, { locale })}
      </Link>
      <h1 className="mt-4 text-3xl font-bold">{document.title}</h1>
      <p className="mt-1 text-sm text-gray-600">{m.legal_updated({ version }, { locale })}</p>

      {!configured && (
        <p role="note" className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          {m.legal_controller_unset({}, { locale })} {m.legal_review_notice({}, { locale })}
        </p>
      )}
      {configured && (
        <section aria-label="Controller" className="mt-4 rounded border p-3 text-sm">
          <p className="font-semibold">{controller.name}</p>
          {controller.taxId && <p>{controller.taxId}</p>}
          {email && (
            <p>
              <a href={`mailto:${email}`} className="underline">
                {email}
              </a>
            </p>
          )}
        </section>
      )}

      <p className="mt-6">{document.intro}</p>
      {document.sections.map((section) => (
        <section key={section.id} id={section.id} className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">{section.title}</h2>
          {section.blocks.map(renderBlock)}
        </section>
      ))}

      {kind === "privacy" && (
        <p className="mt-8">
          <Link href="/delivery-express/profile/privacidade" className="font-semibold text-orange-700 underline">
            {m.privacy_title({}, { locale })}
          </Link>
        </p>
      )}
    </main>
  )
}
