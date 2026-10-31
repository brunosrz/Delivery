import { afterEach, describe, expect, it, vi } from "vitest"
import { createApiClient } from "../src/index.js"

const meta = { requestId: "req_123456789", apiVersion: "v1" }

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "x-request-id": "req_123456789", ...headers },
  })
}

const order = {
  id: "ord_1",
  restaurantId: "rest_1",
  customerId: "usr_1",
  fulfillment: "pickup",
  status: "pending",
  payment: { method: "cash", status: "pending" },
  quote: {
    restaurantId: "rest_1",
    lines: [
      { productId: "prod_1", name: "Pizza", quantity: 1, unitPriceCents: 4000, addonsCents: 0, lineTotalCents: 4000 },
    ],
    subtotalCents: 4000,
    deliveryCents: 0,
    discountCents: 0,
    totalCents: 4000,
  },
  address: null,
  timeline: [{ status: "pending", at: "2026-10-31T12:00:00Z", actorRole: "customer" }],
  createdAt: "2026-10-31T12:00:00Z",
  updatedAt: "2026-10-31T12:00:00Z",
}
const createRequest = {
  restaurantId: "rest_1",
  fulfillment: "pickup" as const,
  items: [{ productId: "prod_1", quantity: 1, addonOptionIds: [] }],
  paymentMethod: "cash" as const,
  expectedTotalCents: 4000,
}
const KEY = "chave-idempotente-0001"

type Init = RequestInit & { headers: Record<string, string> }

describe("pedidos e cotação", () => {
  it("cria o pedido enviando a Idempotency-Key, o corpo JSON e os headers da chamada", async () => {
    const fetch = vi.fn(async () => jsonResponse({ data: order, error: null, meta }, 201))
    const result = await createApiClient({ baseUrl: "https://api.test", fetch }).createOrder(createRequest, KEY, {
      headers: { cookie: "sessao=1" },
    })
    expect(result.ok).toBe(true)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, Init]
    expect(url).toBe("https://api.test/v1/orders")
    expect(init.method).toBe("POST")
    expect(init.headers["idempotency-key"]).toBe(KEY)
    expect(init.headers.cookie).toBe("sessao=1")
    expect(JSON.parse(init.body as string)).toEqual(createRequest)
  })

  it("repete a criação com a MESMA chave após timeout", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new DOMException("timeout", "TimeoutError"))
      .mockResolvedValueOnce(jsonResponse({ data: order, error: null, meta }, 200))
    const result = await createApiClient({ baseUrl: "https://api.test", fetch, retries: 1 }).createOrder(
      createRequest,
      KEY,
    )
    expect(result.ok).toBe(true)
    const keys = fetch.mock.calls.map((call) => (call[1] as Init).headers["idempotency-key"])
    expect(keys).toEqual([KEY, KEY])
  })

  it("nunca repete uma cotação (POST sem chave)", async () => {
    const fetch = vi.fn(async () =>
      jsonResponse({ data: null, error: { code: "unavailable", message: "x" }, meta }, 503),
    )
    await createApiClient({ baseUrl: "https://api.test", fetch, retries: 3 }).quoteCart({
      restaurantId: "rest_1",
      fulfillment: "pickup",
      items: [{ productId: "prod_1", quantity: 1, addonOptionIds: [] }],
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("lê o pedido pelo id codificado", async () => {
    const fetch = vi.fn(async () => jsonResponse({ data: order, error: null, meta }))
    await createApiClient({ baseUrl: "https://api.test", fetch }).getOrder("a/b")
    expect(fetch).toHaveBeenCalledWith("https://api.test/v1/orders/a%2Fb", expect.anything())
  })
})

describe("contrato do envelope", () => {
  afterEach(() => vi.useRealTimers())

  it("trata envelope de sucesso com status 500 como fora do contrato, sem repetir", async () => {
    const fetch = vi.fn(async () => jsonResponse({ data: [], error: null, meta }, 500))
    const result = await createApiClient({ baseUrl: "https://api.test", fetch, retries: 2 }).listRestaurants()
    expect(result).toMatchObject({ ok: false, status: 500, error: { code: "internal" } })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("usa meta.requestId quando o header x-request-id não vem", async () => {
    const fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ data: [], error: null, meta }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    )
    const result = await createApiClient({ baseUrl: "https://api.test", fetch }).listRestaurants()
    expect(result).toEqual({ ok: true, data: [], requestId: "req_123456789" })
  })

  it("respeita Retry-After (com teto) antes da nova tentativa", async () => {
    vi.useFakeTimers()
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ data: null, error: { code: "unavailable", message: "x" }, meta }, 503, { "retry-after": "60" }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: [], error: null, meta }))
    const pending = createApiClient({ baseUrl: "https://api.test", fetch, retries: 1 }).listRestaurants()
    await vi.advanceTimersByTimeAsync(1000)
    expect(fetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect((await pending).ok).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})

describe("fila do restaurante, entregas e transição", () => {
  const list = (data: unknown) => vi.fn(async () => jsonResponse({ data, error: null, meta }))

  it("lista a fila do restaurante com o id codificado e os headers da chamada", async () => {
    const fetch = list([order])
    const result = await createApiClient({ baseUrl: "https://api.test", fetch }).listRestaurantOrders("rest/1", {
      headers: { cookie: "sessao=1" },
    })
    expect(result).toMatchObject({ ok: true, data: [{ id: "ord_1" }] })
    const [url, init] = fetch.mock.calls[0] as unknown as [string, Init]
    expect(url).toBe("https://api.test/v1/manage/restaurants/rest%2F1/orders")
    expect(init.headers.cookie).toBe("sessao=1")
  })

  it("lista as entregas do entregador", async () => {
    const fetch = list([order])
    await createApiClient({ baseUrl: "https://api.test", fetch }).listCourierOrders()
    expect(fetch).toHaveBeenCalledWith("https://api.test/v1/courier/orders", expect.anything())
  })

  it("transiciona o pedido sem repetir em caso de falha", async () => {
    const fetch = vi.fn(async () =>
      jsonResponse({ data: null, error: { code: "unavailable", message: "x" }, meta }, 503),
    )
    await createApiClient({ baseUrl: "https://api.test", fetch, retries: 3 }).transitionOrder("ord_1", {
      to: "accepted",
    })
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, Init]
    expect(url).toBe("https://api.test/v1/orders/ord_1/transitions")
    expect(JSON.parse(init.body as string)).toEqual({ to: "accepted" })
  })

  it("aceita Retry-After como data HTTP", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-10-31T12:00:00Z"))
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ data: null, error: { code: "unavailable", message: "x" }, meta }, 503, {
          "retry-after": new Date("2026-10-31T12:00:01Z").toUTCString(),
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: [], error: null, meta }))
    const pending = createApiClient({ baseUrl: "https://api.test", fetch, retries: 1 }).listRestaurants()
    await vi.advanceTimersByTimeAsync(500)
    expect(fetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(600)
    expect((await pending).ok).toBe(true)
  })

  it("ignora Retry-After inválido ou no passado", async () => {
    vi.useFakeTimers()
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ data: null, error: { code: "unavailable", message: "x" }, meta }, 503, {
          "retry-after": "lixo",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: [], error: null, meta }))
    const pending = createApiClient({ baseUrl: "https://api.test", fetch, retries: 1 }).listRestaurants()
    await vi.advanceTimersByTimeAsync(0)
    expect((await pending).ok).toBe(true)
  })
})
