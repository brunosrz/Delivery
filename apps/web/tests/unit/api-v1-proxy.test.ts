import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GET, POST, isAllowed } from "@/app/api/v1/[...path]/route"

const params = (...path: string[]) => ({ params: Promise.resolve({ path }) })

describe("isAllowed", () => {
  it.each([
    ["POST", ["quotes"]],
    ["POST", ["orders"]],
    ["GET", ["orders"]],
    ["GET", ["orders", "ord_123"]],
    ["POST", ["orders", "ord_123", "payment"]],
  ])("permite %s %j", (method, path) => expect(isAllowed(method, path)).toBe(true))

  it.each([
    ["POST", ["orders", "ord_1", "transitions"]],
    ["GET", ["manage", "restaurants", "r1", "orders"]],
    ["POST", ["webhooks", "asaas"]],
    ["GET", ["me"]],
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

  it("não chama o backend em rota fora da lista", async () => {
    const response = await POST(
      new Request("http://web.test/api/v1/orders/o1/transitions", { method: "POST", body: "{}" }),
      params("orders", "o1", "transitions"),
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
