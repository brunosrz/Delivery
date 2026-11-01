import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DELETE, GET, POST } from "@/app/api/v1/[...path]/route"
import { isAllowed } from "@/lib/api-proxy-rules"

const params = (...path: string[]) => ({ params: Promise.resolve({ path }) })

describe("isAllowed", () => {
  it.each([
    ["POST", ["quotes"]],
    ["POST", ["contact"]],
    ["POST", ["consents"]],
    ["POST", ["legal", "acceptances"]],
    ["POST", ["orders"]],
    ["GET", ["orders"]],
    ["GET", ["orders", "ord_123"]],
    ["GET", ["me", "export"]],
    ["DELETE", ["me"]],
    ["POST", ["orders", "ord_123", "payment"]],
    ["POST", ["orders", "ord_123", "transitions"]],
    ["GET", ["manage", "restaurants", "rest_1", "mkit", "materials"]],
    ["POST", ["manage", "restaurants", "rest_1", "mkit", "materials"]],
    ["PATCH", ["manage", "restaurants", "rest_1", "mkit", "materials", "m1"]],
    ["DELETE", ["manage", "restaurants", "rest_1", "mkit", "materials", "m1"]],
    ["GET", ["manage", "restaurants", "rest_1", "mkit", "materials", "m1", "export"]],
  ])("permite %s %j", (method, path) => expect(isAllowed(method, path)).toBe(true))

  it.each([
    ["GET", ["orders", "ord_1", "transitions"]],
    ["GET", ["manage", "restaurants", "r1", "orders"]],
    ["GET", ["manage", "restaurants", "r1"]],
    ["POST", ["manage", "restaurants", "r1", "mkit", "materials", "m1", "export"]],
    ["PUT", ["manage", "restaurants", "r1", "mkit", "materials", "m1"]],
    ["POST", ["webhooks", "asaas"]],
    ["GET", ["me"]],
    ["GET", ["consents"]],
    ["POST", ["legal"]],
    ["GET", ["legal", "acceptances"]],
    ["POST", ["me"]],
    ["PATCH", ["me"]],
    ["POST", ["me", "export"]],
    ["DELETE", ["me", "export"]],
    ["DELETE", ["me", "other"]],
    ["GET", ["quotes"]],
    ["POST", ["orders", "..", "me"]],
    ["GET", ["orders", "a/b"]],
  ])("recusa %s %j", (method, path) => expect(isAllowed(method, path)).toBe(false))
})

describe("proxy /api/v1", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    process.env.CASA_DAS_MAQUINAS_URL = "http://api.test"
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => vi.unstubAllGlobals())

  it("repassa corpo, Idempotency-Key e cookie, e devolve o status e o replay", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"data":{}}', {
        status: 200,
        headers: { "content-type": "application/json", "idempotent-replayed": "true", "set-cookie": "x=1" },
      }),
    )
    const response = await POST(
      new Request("http://web.test/api/v1/orders", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": "chave-idempotente-0001",
          cookie: "better-auth.session_token=abc",
          authorization: "Bearer vazado",
        },
        body: '{"a":1}',
      }),
      params("orders"),
    )
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit & { headers: Headers }]
    expect(url.toString()).toBe("http://api.test/v1/orders")
    expect(init.headers.get("idempotency-key")).toBe("chave-idempotente-0001")
    expect(init.headers.get("cookie")).toBe("better-auth.session_token=abc")
    expect(init.headers.get("authorization")).toBeNull()
    expect(init.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/)
    expect(response.status).toBe(200)
    expect(response.headers.get("idempotent-replayed")).toBe("true")
    expect(response.headers.get("set-cookie")).toBeNull()
  })

  it("repassa o corpo do DELETE (exclusão de conta exige a frase de confirmação)", async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"data":{"deleted":true}}', { status: 200 }))
    await DELETE(
      new Request("http://web.test/api/v1/me", {
        method: "DELETE",
        headers: { "content-type": "application/json", cookie: "better-auth.session_token=abc" },
        body: '{"confirm":"EXCLUIR MINHA CONTA"}',
      }),
      params("me"),
    )
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(String(url)).toBe("http://api.test/v1/me")
    expect(init.method).toBe("DELETE")
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe('{"confirm":"EXCLUIR MINHA CONTA"}')
  })

  it("recusa escrita vinda de outro site, mesmo com cookie, sem chamar o backend", async () => {
    const response = await POST(
      new Request("http://web.test/api/v1/orders", {
        method: "POST",
        headers: {
          origin: "https://evil.example",
          cookie: "better-auth.session_token=abc",
          "sec-fetch-site": "cross-site",
        },
        body: "{}",
      }),
      params("orders"),
    )
    expect(response.status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("encaminha o sinal Global Privacy Control e marca as respostas como no-store", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"data":{}}', { status: 200, headers: { "content-type": "application/json" } }),
    )
    const response = await POST(
      new Request("http://web.test/api/v1/consents", {
        method: "POST",
        headers: { "content-type": "application/json", "sec-gpc": "1", origin: "http://web.test" },
        body: "{}",
      }),
      params("consents"),
    )
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit & { headers: Headers }]
    expect(init.headers.get("sec-gpc")).toBe("1")
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("não chama o backend em rota fora da lista", async () => {
    const response = await POST(
      new Request("http://web.test/api/v1/webhooks/asaas", { method: "POST", body: "{}" }),
      params("webhooks", "asaas"),
    )
    expect(response.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("responde 503 sem backend configurado ou fora do ar", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("down"))
    expect((await GET(new Request("http://web.test/api/v1/orders"), params("orders"))).status).toBe(503)
    delete process.env.CASA_DAS_MAQUINAS_URL
    expect((await GET(new Request("http://web.test/api/v1/orders"), params("orders"))).status).toBe(503)
  })
})
