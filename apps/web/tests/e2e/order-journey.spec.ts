import { expect, test, type APIRequestContext } from "@playwright/test"

// Jornada do pedido pela API real (workerd + D1 local), passando pelo proxy do web: cadastro, cotação, criação com
// Idempotency-Key, repetição sem duplicar, leitura, cancelamento e o pagamento online sem provedor configurado.
// A sacola e o checkout pela interface têm a própria cobertura em smoke.spec.ts; a equipe do restaurante e o
// entregador dependem de vínculo no banco e ficam nos testes do Worker (courier.test.ts e orders.test.ts).

const uniqueEmail = () => `jornada-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`

// Burger clássico (32,90) + ao ponto + bacon (5,00) = 37,90 por unidade; entrega R$ 5,90.
const item = { productId: "prod_bg_classico", quantity: 2, addonOptionIds: ["opt_bg_ponto", "opt_bg_bacon"] }
const address = {
  street: "Rua das Flores",
  number: "120",
  district: "Centro",
  city: "São João Batista do Glória",
  state: "MG",
  postalCode: "37920-000",
}
const TOTAL = 2 * 3790 + 590

async function signUp(request: APIRequestContext, baseURL: string) {
  const response = await request.post("/api/auth/sign-up/email", {
    headers: { origin: baseURL },
    data: { email: uniqueEmail(), password: "senha-forte-123", name: "Cliente Jornada" },
  })
  expect(response.status()).toBe(200)
}

const key = () => `e2e-${crypto.randomUUID()}`

test.describe("jornada do pedido pela API", () => {
  test.beforeEach(async ({ request, baseURL }) => signUp(request, baseURL ?? ""))

  test("cota, cria o pedido, repete a mesma chave sem duplicar e lê a linha do tempo", async ({ request }) => {
    const quote = await request.post("/api/v1/quotes", {
      data: { restaurantId: "rest_burger", fulfillment: "delivery", items: [item] },
    })
    expect(quote.status()).toBe(200)
    expect((await quote.json()).data).toMatchObject({ subtotalCents: 7580, deliveryCents: 590, totalCents: TOTAL })

    const body = {
      restaurantId: "rest_burger",
      fulfillment: "delivery",
      items: [item],
      paymentMethod: "cash",
      expectedTotalCents: TOTAL,
      address,
    }
    const idempotencyKey = key()
    const created = await request.post("/api/v1/orders", { data: body, headers: { "idempotency-key": idempotencyKey } })
    expect(created.status()).toBe(201)
    const order = (await created.json()).data
    expect(order).toMatchObject({ status: "pending", payment: { method: "cash", status: "pending" } })
    expect(order.timeline).toHaveLength(1)

    const replay = await request.post("/api/v1/orders", { data: body, headers: { "idempotency-key": idempotencyKey } })
    expect(replay.status()).toBe(200)
    expect(replay.headers()["idempotent-replayed"]).toBe("true")
    expect((await replay.json()).data.id).toBe(order.id)

    const mismatch = await request.post("/api/v1/orders", {
      data: { ...body, expectedTotalCents: TOTAL, items: [{ ...item, quantity: 1 }] },
      headers: { "idempotency-key": idempotencyKey },
    })
    expect(mismatch.status()).toBe(422)

    const read = await request.get(`/api/v1/orders/${order.id}`)
    expect(read.status()).toBe(200)
    expect((await read.json()).data.id).toBe(order.id)

    const mine = await request.get("/api/v1/orders")
    expect((await mine.json()).data.map((entry: { id: string }) => entry.id)).toContain(order.id)
  })

  test("recusa total desatualizado e permite cancelar o pedido pendente", async ({ request }) => {
    const base = {
      restaurantId: "rest_burger",
      fulfillment: "delivery",
      items: [item],
      paymentMethod: "cash",
      address,
    }
    const stale = await request.post("/api/v1/orders", {
      data: { ...base, expectedTotalCents: TOTAL - 100 },
      headers: { "idempotency-key": key() },
    })
    expect(stale.status()).toBe(409)

    const created = await request.post("/api/v1/orders", {
      data: { ...base, expectedTotalCents: TOTAL },
      headers: { "idempotency-key": key() },
    })
    const order = (await created.json()).data
    const cancelled = await request.post(`/api/v1/orders/${order.id}/transitions`, { data: { to: "cancelled" } })
    expect(cancelled.status()).toBe(200)
    expect((await cancelled.json()).data.status).toBe("cancelled")

    // Cancelado é terminal: repetir a transição é recusado.
    const again = await request.post(`/api/v1/orders/${order.id}/transitions`, { data: { to: "cancelled" } })
    expect(again.status()).toBe(409)
  })

  test("pagamento online sem Asaas configurado deixa o pedido pendente e não inventa cobrança", async ({ request }) => {
    const payer = { name: "Maria da Silva", cpfCnpj: "249.715.637-92" }
    const created = await request.post("/api/v1/orders", {
      data: {
        restaurantId: "rest_burger",
        fulfillment: "pickup",
        items: [item],
        paymentMethod: "pix",
        payer,
        expectedTotalCents: 2 * 3790,
      },
      headers: { "idempotency-key": key() },
    })
    expect(created.status()).toBe(201)
    const order = (await created.json()).data
    expect(order.payment).toEqual({ method: "pix", status: "pending" })
    expect(order.charge ?? null).toBeNull()

    const retry = await request.post(`/api/v1/orders/${order.id}/payment`, { data: { payer } })
    expect(retry.status()).toBe(503)
    expect((await retry.json()).error.code).toBe("unavailable")
  })

  test("não expõe rotas internas pelo proxy", async ({ request }) => {
    expect((await request.get("/api/v1/me")).status()).toBe(404)
    expect((await request.post("/api/v1/webhooks/asaas", { data: {} })).status()).toBe(404)
    expect((await request.get("/api/v1/manage/restaurants/rest_burger/orders")).status()).toBe(404)
  })
})
