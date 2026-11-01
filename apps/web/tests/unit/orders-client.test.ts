import { IdempotencyKey } from "@delivery/contracts"
import { describe, expect, it, vi } from "vitest"
import { newIdempotencyKey, requestQuote, submitOrder } from "@/lib/orders-client"

const meta = { requestId: "req_123456789", apiVersion: "v1" }
const quote = {
  restaurantId: "rest_1",
  lines: [{ productId: "p1", name: "Pizza", quantity: 1, unitPriceCents: 4000, addonsCents: 0, lineTotalCents: 4000 }],
  subtotalCents: 4000,
  deliveryCents: 500,
  discountCents: 0,
  totalCents: 4500,
}
const request = {
  restaurantId: "rest_1",
  fulfillment: "delivery" as const,
  items: [{ productId: "p1", quantity: 1, addonOptionIds: [] }],
}

describe("orders-client", () => {
  it("devolve a cotação validada pelo contrato", async () => {
    const doFetch = vi.fn(async () => Response.json({ data: quote, error: null, meta }))
    const result = await requestQuote(request, doFetch as unknown as typeof fetch)
    expect(result).toMatchObject({ ok: true, data: { totalCents: 4500 } })
    const [url, init] = doFetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("/api/v1/quotes")
    expect(JSON.parse(init.body as string)).toEqual(request)
  })

  it("mantém o erro do envelope (ex.: total mudou)", async () => {
    const doFetch = vi.fn(async () =>
      Response.json(
        { data: null, error: { code: "conflict", message: "o total do pedido mudou" }, meta },
        { status: 409 },
      ),
    )
    const result = await submitOrder(
      { ...request, paymentMethod: "cash", expectedTotalCents: 1, address: undefined } as never,
      "web-chave-0000000000000001",
      doFetch as unknown as typeof fetch,
    )
    expect(result).toMatchObject({ ok: false, status: 409, error: { code: "conflict" } })
  })

  it("envia a Idempotency-Key e sinaliza repetição", async () => {
    const order = {
      id: "ord_1",
      restaurantId: "rest_1",
      customerId: "u1",
      fulfillment: "pickup",
      status: "pending",
      payment: { method: "cash", status: "pending" },
      quote,
      address: null,
      timeline: [{ status: "pending", at: "2026-10-31T12:00:00Z", actorRole: "customer" }],
      createdAt: "2026-10-31T12:00:00Z",
      updatedAt: "2026-10-31T12:00:00Z",
    }
    const doFetch = vi.fn(async () =>
      Response.json({ data: order, error: null, meta }, { headers: { "idempotent-replayed": "true" } }),
    )
    const result = await submitOrder(
      { ...request, fulfillment: "pickup", paymentMethod: "cash", expectedTotalCents: 4500 },
      "web-chave-0000000000000001",
      doFetch as unknown as typeof fetch,
    )
    expect(result).toMatchObject({ ok: true, replayed: true })
    const [, init] = doFetch.mock.calls[0] as unknown as [string, RequestInit & { headers: Record<string, string> }]
    expect(init.headers["idempotency-key"]).toBe("web-chave-0000000000000001")
  })

  it("trata rede fora do ar, corpo inválido e resposta fora do contrato", async () => {
    const down = vi.fn(async () => {
      throw new TypeError("offline")
    })
    expect(await requestQuote(request, down as unknown as typeof fetch)).toMatchObject({
      ok: false,
      error: { code: "unavailable" },
    })

    const html = vi.fn(async () => new Response("<html>", { status: 502 }))
    expect(await requestQuote(request, html as unknown as typeof fetch)).toMatchObject({ ok: false, status: 502 })

    const wrong = vi.fn(async () => Response.json({ data: { x: 1 }, error: null, meta }))
    expect(await requestQuote(request, wrong as unknown as typeof fetch)).toMatchObject({
      ok: false,
      error: { code: "internal" },
    })
  })

  it("gera chaves de idempotência válidas e distintas", () => {
    const a = newIdempotencyKey()
    expect(IdempotencyKey.safeParse(a).success).toBe(true)
    expect(newIdempotencyKey()).not.toBe(a)
  })
})
