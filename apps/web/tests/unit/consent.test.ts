import { CONSENT_MAX_AGE_DAYS, CONSENT_VERSION } from "@delivery/contracts"
import { describe, expect, it } from "vitest"
import {
  CONSENT_COOKIE,
  consentCookie,
  consentFromCookieHeader,
  gpcEnabled,
  hasConsent,
  newConsent,
  parseConsent,
  serializeConsent,
} from "@/lib/consent"

const NOW = Date.UTC(2026, 10, 1, 12)
const DAY = 24 * 60 * 60 * 1000
const ID = "0b9b1d2e-3c4d-4e5f-8a6b-7c8d9e0f1a2b"
const stored = (overrides: Record<string, unknown> = {}) =>
  encodeURIComponent(JSON.stringify({ v: CONSENT_VERSION, id: ID, a: true, m: false, t: NOW - DAY, ...overrides }))

describe("parseConsent", () => {
  it("lê uma escolha válida", () => {
    expect(parseConsent(stored(), NOW)).toEqual({ v: CONSENT_VERSION, id: ID, a: true, m: false, t: NOW - DAY })
  })

  it("sem cookie, não há escolha", () => {
    expect(parseConsent(undefined, NOW)).toBeNull()
    expect(parseConsent(null, NOW)).toBeNull()
    expect(parseConsent("", NOW)).toBeNull()
  })

  it("lixo, JSON inválido e formatos errados valem como sem escolha", () => {
    const raws = [
      "%E0%A4%A",
      "nao-e-json",
      encodeURIComponent("[]"),
      encodeURIComponent("null"),
      encodeURIComponent('"x"'),
    ]
    for (const raw of raws) expect(parseConsent(raw, NOW), raw).toBeNull()
    const bad = [{ id: "x" }, { a: "sim" }, { m: 1 }, { t: "ontem" }, { t: Number.NaN }, { id: undefined }]
    for (const override of bad) expect(parseConsent(stored(override), NOW), JSON.stringify(override)).toBeNull()
  })

  it("versão antiga da lista de categorias pede consentimento de novo", () => {
    expect(parseConsent(stored({ v: CONSENT_VERSION - 1 }), NOW)).toBeNull()
    expect(parseConsent(stored({ v: CONSENT_VERSION + 1 }), NOW)).toBeNull()
  })

  it("expira em 12 meses; exatamente no limite ainda vale", () => {
    expect(parseConsent(stored({ t: NOW - CONSENT_MAX_AGE_DAYS * DAY }), NOW)).not.toBeNull()
    expect(parseConsent(stored({ t: NOW - CONSENT_MAX_AGE_DAYS * DAY - 1 }), NOW)).toBeNull()
  })

  it("data no futuro além da tolerância de relógio é inválida", () => {
    expect(parseConsent(stored({ t: NOW + 60 * 1000 }), NOW)).not.toBeNull()
    expect(parseConsent(stored({ t: NOW + 10 * 60 * 1000 }), NOW)).toBeNull()
  })
})

describe("gravação e leitura do cookie", () => {
  it("newConsent usa a versão vigente e mantém o id quando informado", () => {
    const first = newConsent({ analytics: false, marketing: false }, NOW)
    expect(first).toMatchObject({ v: CONSENT_VERSION, a: false, m: false, t: NOW })
    expect(first.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(newConsent({ analytics: true, marketing: true }, NOW, ID).id).toBe(ID)
  })

  it("serializa e lê de volta sem perder nada", () => {
    const consent = newConsent({ analytics: true, marketing: false }, NOW, ID)
    expect(parseConsent(serializeConsent(consent), NOW)).toEqual(consent)
  })

  it("a linha do cookie tem caminho, validade de 12 meses, SameSite e Secure só em HTTPS", () => {
    const consent = newConsent({ analytics: false, marketing: false }, NOW, ID)
    const line = consentCookie(consent, false)
    expect(line.startsWith(`${CONSENT_COOKIE}=`)).toBe(true)
    expect(line).toContain("Path=/")
    expect(line).toContain(`Max-Age=${CONSENT_MAX_AGE_DAYS * 24 * 60 * 60}`)
    expect(line).toContain("SameSite=Lax")
    expect(line).not.toContain("Secure")
    expect(consentCookie(consent, true)).toContain("; Secure")
    // O script que decide o que carregar precisa ler o cookie: sem HttpOnly.
    expect(line).not.toContain("HttpOnly")
  })

  it("encontra o cookie no meio de outros", () => {
    const consent = newConsent({ analytics: true, marketing: true }, NOW, ID)
    const header = `a=1; ${CONSENT_COOKIE}=${serializeConsent(consent)}; b=2`
    expect(consentFromCookieHeader(header, NOW)).toEqual(consent)
    expect(consentFromCookieHeader("a=1; b=2", NOW)).toBeNull()
    expect(consentFromCookieHeader(undefined, NOW)).toBeNull()
  })
})

describe("hasConsent e GPC", () => {
  it("sem escolha, nada opcional é permitido", () => {
    expect(hasConsent(null, "analytics")).toBe(false)
    expect(hasConsent(null, "marketing")).toBe(false)
  })

  it("respeita cada categoria separadamente", () => {
    const consent = newConsent({ analytics: true, marketing: false }, NOW, ID)
    expect(hasConsent(consent, "analytics")).toBe(true)
    expect(hasConsent(consent, "marketing")).toBe(false)
  })

  it("detecta o Global Privacy Control", () => {
    expect(gpcEnabled({ globalPrivacyControl: true })).toBe(true)
    expect(gpcEnabled({ globalPrivacyControl: false })).toBe(false)
    expect(gpcEnabled({})).toBe(false)
    expect(gpcEnabled(undefined)).toBe(false)
  })
})
