import { describe, expect, it } from "vitest"
import { hasSessionCookie, parseLegalStatus } from "@/lib/legal-status"

const meta = { requestId: "req-12345678", apiVersion: "v1" }
const required = { terms: "2026-11-01", privacy: "2026-11-01" }

describe("parseLegalStatus", () => {
  it("lê a situação do aceite", () => {
    expect(parseLegalStatus({ data: { upToDate: false, required }, error: null, meta })).toEqual({
      upToDate: false,
      required,
    })
    expect(parseLegalStatus({ data: { upToDate: true, required }, error: null, meta })?.upToDate).toBe(true)
  })

  it("resposta de erro ou fora do contrato vira nulo", () => {
    expect(parseLegalStatus({ data: null, error: { code: "unauthenticated", message: "x" }, meta })).toBeNull()
    expect(parseLegalStatus({ data: { upToDate: "sim" }, error: null, meta })).toBeNull()
    expect(parseLegalStatus("texto")).toBeNull()
    expect(parseLegalStatus(null)).toBeNull()
  })
})

describe("hasSessionCookie", () => {
  it("reconhece o cookie de sessão com e sem prefixo seguro", () => {
    expect(hasSessionCookie(["consent", "better-auth.session_token"])).toBe(true)
    expect(hasSessionCookie(["__Secure-better-auth.session_token"])).toBe(true)
  })

  it("outros cookies não contam", () => {
    expect(hasSessionCookie(["consent", "PARAGLIDE_LOCALE", "better-auth.session_data"])).toBe(false)
    expect(hasSessionCookie([])).toBe(false)
  })
})
