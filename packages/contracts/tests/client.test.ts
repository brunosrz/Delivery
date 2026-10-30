import { describe, expect, it, vi } from "vitest"
import { createApiClient } from "../src/index.js"

const meta = { requestId: "req_123456789", apiVersion: "v1" }

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "x-request-id": "req_123456789", ...headers },
  })
}

const restaurant = {
  id: "rest_1",
  slug: "pizzaria",
  name: "Pizzaria",
  description: null,
  logoUrl: null,
  coverUrl: null,
  timezone: "America/Sao_Paulo",
  isOpen: true,
  deliveryEnabled: true,
  pickupEnabled: false,
  deliveryFeeCents: 500,
  minimumOrderCents: 0,
  openingHours: [],
}

describe("createApiClient", () => {
  it("devolve os dados validados e o request id", async () => {
    const fetch = vi.fn(async () => jsonResponse({ data: [restaurant], error: null, meta }))
    const client = createApiClient({ baseUrl: "https://api.test/", fetch, requestId: "origem-0001" })

    const result = await client.listRestaurants()

    expect(result).toEqual({ ok: true, data: [restaurant], requestId: "req_123456789" })
    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/v1/restaurants",
      expect.objectContaining({ method: "GET", headers: expect.objectContaining({ "x-request-id": "origem-0001" }) }),
    )
  })

  it("codifica o slug na URL", async () => {
    const fetch = vi.fn(async () =>
      jsonResponse({ data: null, error: { code: "bad_request", message: "x" }, meta }, 400),
    )
    await createApiClient({ baseUrl: "https://api.test", fetch }).getMenu("a/b")
    expect(fetch).toHaveBeenCalledWith("https://api.test/v1/restaurants/a%2Fb/menu", expect.anything())
  })

  it("repassa o erro do envelope sem repetir 4xx", async () => {
    const fetch = vi.fn(async () =>
      jsonResponse({ data: null, error: { code: "not_found", message: "restaurante não encontrado" }, meta }, 404),
    )
    const result = await createApiClient({ baseUrl: "https://api.test", fetch, retries: 3 }).getMenu("x")
    expect(result).toEqual({
      ok: false,
      status: 404,
      error: { code: "not_found", message: "restaurante não encontrado" },
      requestId: "req_123456789",
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("repete leituras após 503 e para no sucesso", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: null, error: { code: "unavailable", message: "db" }, meta }, 503))
      .mockResolvedValueOnce(jsonResponse({ data: [], error: null, meta }))
    const result = await createApiClient({ baseUrl: "https://api.test", fetch, retries: 2 }).listRestaurants()
    expect(result.ok).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it("respeita o limite de tentativas em falha de rede", async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError("network down")
    })
    const result = await createApiClient({ baseUrl: "https://api.test", fetch, retries: 2 }).listRestaurants()
    expect(result).toEqual({
      ok: false,
      status: 0,
      error: { code: "unavailable", message: "falha de rede" },
      requestId: null,
    })
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it("aborta a tentativa que passa do timeout", async () => {
    const fetch = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason))
        }),
    )
    const result = await createApiClient({
      baseUrl: "https://api.test",
      fetch,
      retries: 0,
      timeoutMs: 10,
    }).listRestaurants()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toEqual({ code: "unavailable", message: "tempo de resposta esgotado" })
  })

  it("não aceita resposta fora do contrato e não repete", async () => {
    const fetch = vi.fn(async () =>
      jsonResponse({ data: [{ ...restaurant, deliveryFeeCents: 5.5 }], error: null, meta }),
    )
    const result = await createApiClient({ baseUrl: "https://api.test", fetch, retries: 2 }).listRestaurants()
    expect(result).toMatchObject({ ok: false, error: { code: "internal", message: "resposta fora do contrato v1" } })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("trata corpo não JSON como indisponibilidade", async () => {
    const fetch = vi.fn(async () => new Response("<html>bad gateway</html>", { status: 502 }))
    const result = await createApiClient({ baseUrl: "https://api.test", fetch, retries: 1 }).listRestaurants()
    expect(result).toMatchObject({ ok: false, error: { code: "unavailable", message: "resposta não JSON (HTTP 502)" } })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it("não repete resposta não JSON fora de 5xx transitório", async () => {
    const fetch = vi.fn(async () => new Response("oops", { status: 400 }))
    await createApiClient({ baseUrl: "https://api.test", fetch, retries: 3 }).listRestaurants()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
