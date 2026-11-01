import { describe, expect, it } from "vitest"
import nextConfig, { contentSecurityPolicy, privatePaths, securityHeaders } from "../../next.config.mjs"
import { isSameOriginRequest } from "@/lib/origin"

const headersOf = (items: { key: string; value: string }[]) =>
  Object.fromEntries(items.map((item) => [item.key, item.value]))
const loadRules = async () => (await nextConfig.headers?.()) ?? []
const request = (method: string, headers: Record<string, string> = {}) =>
  new Request("https://app.example/api/v1/me", { method, headers })

describe("cabeçalhos de segurança do site", () => {
  const headers = headersOf(securityHeaders)

  it("define o conjunto mínimo de proteções", () => {
    expect(headers["Strict-Transport-Security"]).toMatch(/max-age=\d{8,}/)
    expect(headers["X-Content-Type-Options"]).toBe("nosniff")
    expect(headers["X-Frame-Options"]).toBe("DENY")
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin")
    expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin")
    expect(headers["Permissions-Policy"]).toContain("camera=()")
    expect(headers["Permissions-Policy"]).toContain("microphone=()")
  })

  it("a CSP fecha frames, plugins, base e formulários para fora, e só permite a própria origem", () => {
    expect(contentSecurityPolicy).toContain("default-src 'self'")
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'")
    expect(contentSecurityPolicy).toContain("object-src 'none'")
    expect(contentSecurityPolicy).toContain("base-uri 'self'")
    expect(contentSecurityPolicy).toContain("form-action 'self'")
    expect(contentSecurityPolicy).toContain("connect-src 'self'")
    // Nenhuma origem externa liberada para script, imagem ou conexão.
    expect(contentSecurityPolicy).not.toMatch(/https?:\/\//)
    expect(contentSecurityPolicy).not.toContain("*")
  })

  it("não vaza o framework e aplica os cabeçalhos a todas as rotas", async () => {
    expect(nextConfig.poweredByHeader).toBe(false)
    const rules = await loadRules()
    expect(rules[0]).toMatchObject({ source: "/:path*", headers: securityHeaders })
  })

  it("páginas com dado de conta ou de pedido não ficam em cache", async () => {
    const rules = await loadRules()
    for (const source of privatePaths) {
      const rule = rules.find((item) => item.source === source)
      if (!rule) throw new Error(`regra ausente: ${source}`)
      expect(headersOf(rule.headers)["Cache-Control"]).toBe("private, no-store")
    }
    expect(privatePaths).toEqual(expect.arrayContaining(["/delivery-express/profile/:path*", "/pedidos-na-mao/:path*"]))
  })
})

describe("isSameOriginRequest (CSRF)", () => {
  it("leituras sempre passam", () => {
    expect(isSameOriginRequest(request("GET", { origin: "https://evil.example" }))).toBe(true)
  })

  it("escrita do próprio site passa", () => {
    expect(
      isSameOriginRequest(request("POST", { origin: "https://app.example", "sec-fetch-site": "same-origin" })),
    ).toBe(true)
    expect(isSameOriginRequest(request("DELETE", { origin: "https://app.example" }))).toBe(true)
  })

  it("escrita vinda de outro site é recusada", () => {
    expect(isSameOriginRequest(request("POST", { origin: "https://evil.example" }))).toBe(false)
    expect(isSameOriginRequest(request("DELETE", { "sec-fetch-site": "cross-site" }))).toBe(false)
    expect(isSameOriginRequest(request("PATCH", { "sec-fetch-site": "same-site" }))).toBe(false)
    expect(isSameOriginRequest(request("POST", { origin: "null" }))).toBe(false)
    expect(isSameOriginRequest(request("POST", { origin: "https://app.example.evil.com" }))).toBe(false)
  })

  it("origem malformada é recusada; sem Origin (cliente que não é navegador) passa", () => {
    expect(isSameOriginRequest(request("POST", { origin: "isto nao e url" }))).toBe(false)
    expect(isSameOriginRequest(request("POST"))).toBe(true)
  })

  it("atrás de proxy, vale o host encaminhado", () => {
    const proxied = new Request("http://internal:3000/api/v1/me", {
      method: "POST",
      headers: { origin: "https://app.example", "x-forwarded-host": "app.example" },
    })
    expect(isSameOriginRequest(proxied)).toBe(true)
  })
})
