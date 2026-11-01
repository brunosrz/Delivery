import { describe, expect, it, vi } from "vitest"
import { newConsent } from "@/lib/consent"
import { reportConsent } from "@/lib/consent-client"
import { acceptLegalDocuments } from "@/lib/legal-client"

const asFetch = (fn: unknown) => fn as typeof fetch
const consent = newConsent({ analytics: true, marketing: false }, Date.now(), "0b9b1d2e-3c4d-4e5f-8a6b-7c8d9e0f1a2b")

describe("reportConsent", () => {
  it("manda a escolha, a origem e o idioma ao servidor", async () => {
    const doFetch = vi.fn(async () => new Response("{}", { status: 200 }))
    expect(await reportConsent(consent, "banner", "en", asFetch(doFetch))).toBe(true)
    const [url, init] = doFetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("/api/v1/consents")
    expect(init.method).toBe("POST")
    expect(JSON.parse(init.body as string)).toEqual({
      consentId: consent.id,
      version: consent.v,
      analytics: true,
      marketing: false,
      source: "banner",
      locale: "en",
    })
  })

  it("falha de rede ou de servidor não derruba a navegação", async () => {
    const down = vi.fn(async () => {
      throw new TypeError("offline")
    })
    expect(await reportConsent(consent, "preferences", "pt-BR", asFetch(down))).toBe(false)
    const bad = vi.fn(async () => new Response("{}", { status: 500 }))
    expect(await reportConsent(consent, "gpc", "pt-BR", asFetch(bad))).toBe(false)
  })
})

describe("acceptLegalDocuments", () => {
  it("manda as versões vigentes dos dois documentos", async () => {
    const doFetch = vi.fn(async () => new Response("{}", { status: 200 }))
    expect(await acceptLegalDocuments(asFetch(doFetch))).toBe(true)
    const [url, init] = doFetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("/api/v1/legal/acceptances")
    expect(JSON.parse(init.body as string)).toEqual({ terms: "2026-11-01", privacy: "2026-11-01" })
  })

  it("devolve falso quando o servidor recusa ou a rede cai", async () => {
    expect(await acceptLegalDocuments(asFetch(vi.fn(async () => new Response("{}", { status: 400 }))))).toBe(false)
    const down = vi.fn(async () => {
      throw new TypeError("offline")
    })
    expect(await acceptLegalDocuments(asFetch(down))).toBe(false)
  })
})
