import { Order, Quote, envelope } from "@delivery/contracts"
import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { call, newUser, postJson } from "./helpers"

// Burger clássico (32,90) + ao ponto + bacon (5,00) = 37,90 por unidade; entrega 5,90.
const burgerItem = { productId: "prod_bg_classico", quantity: 2, addonOptionIds: ["opt_bg_ponto", "opt_bg_bacon"] }
const orderBody = {
  restaurantId: "rest_burger",
  fulfillment: "delivery",
  items: [burgerItem],
  paymentMethod: "pix_on_delivery",
  expectedTotalCents: 2 * 3790 + 590,
  address: {
    street: "Rua das Flores",
    number: "120",
    district: "Centro",
    city: "São João Batista do Glória",
    state: "MG",
    postalCode: "37920-000",
  },
}

const key = () => `chave-${crypto.randomUUID()}`
const parseOrder = async (response: Response) => envelope(Order).parse(await response.json()).data as Order

async function createOrder(cookie: string, body: unknown = orderBody, idempotencyKey = key()) {
  return postJson("/v1/orders", body, { cookie, "idempotency-key": idempotencyKey })
}

const transition = (cookie: string, orderId: string, to: string) =>
  postJson(`/v1/orders/${orderId}/transitions`, { to }, { cookie })

describe("POST /v1/quotes", () => {
  it("calcula o preço no servidor", async () => {
    const response = await postJson("/v1/quotes", {
      restaurantId: "rest_burger",
      fulfillment: "delivery",
      items: [burgerItem],
    })
    expect(response.status).toBe(200)
    const { data } = envelope(Quote).parse(await response.json())
    expect(data).toMatchObject({ subtotalCents: 7580, deliveryCents: 590, totalCents: 8170 })
  })

  it("devolve cada problema no campo correspondente", async () => {
    const response = await postJson("/v1/quotes", {
      restaurantId: "rest_burger",
      fulfillment: "delivery",
      items: [{ productId: "prod_bg_classico", quantity: 1, addonOptionIds: ["opt_pz_catupiry"] }],
    })
    expect(response.status).toBe(400)
    const { error } = (await response.json()) as { error: { fields: Record<string, string[]> } }
    expect(error.fields).toEqual({
      "items.0.addonOptionIds.0": ["adicional não pertence ao produto"],
      "items.0.addonOptionIds": ["Ponto da carne: escolha 1"],
    })
  })

  it("rejeita preço enviado pelo cliente e restaurante inexistente", async () => {
    const withPrice = await postJson("/v1/quotes", {
      restaurantId: "rest_burger",
      fulfillment: "pickup",
      items: [burgerItem],
      totalCents: 1,
    })
    expect(withPrice.status).toBe(400)
    const missing = await postJson("/v1/quotes", {
      restaurantId: "nao-existe",
      fulfillment: "pickup",
      items: [burgerItem],
    })
    expect(missing.status).toBe(404)
  })
})

describe("POST /v1/orders", () => {
  it("exige sessão e Idempotency-Key", async () => {
    expect((await postJson("/v1/orders", orderBody, { "idempotency-key": key() })).status).toBe(401)
    const { cookie } = await newUser()
    const noKey = await postJson("/v1/orders", orderBody, { cookie })
    expect(noKey.status).toBe(400)
  })

  it("cria o pedido pendente com a cotação congelada e a linha do tempo", async () => {
    const { userId, cookie } = await newUser()
    const response = await createOrder(cookie)
    expect(response.status).toBe(201)
    expect(response.headers.get("idempotent-replayed")).toBe("false")
    const order = await parseOrder(response)
    expect(order).toMatchObject({
      restaurantId: "rest_burger",
      customerId: userId,
      status: "pending",
      payment: { method: "pix_on_delivery", status: "pending" },
      quote: { totalCents: 8170 },
    })
    expect(order.timeline).toEqual([expect.objectContaining({ status: "pending", actorRole: "customer" })])
  })

  it("repete a mesma chave sem duplicar e rejeita outro corpo com a mesma chave", async () => {
    const { cookie } = await newUser()
    const idempotencyKey = key()
    const first = await parseOrder(await createOrder(cookie, orderBody, idempotencyKey))

    const again = await createOrder(cookie, orderBody, idempotencyKey)
    expect(again.status).toBe(200)
    expect(again.headers.get("idempotent-replayed")).toBe("true")
    expect((await parseOrder(again)).id).toBe(first.id)

    const different = await createOrder(cookie, { ...orderBody, paymentMethod: "cash" }, idempotencyKey)
    expect(different.status).toBe(422)
    expect(((await different.json()) as { error: { code: string } }).error.code).toBe("idempotency_mismatch")

    const count = await env.DB.prepare("select count(*) as n from orders where idempotency_key = ?")
      .bind(idempotencyKey)
      .first("n")
    expect(count).toBe(1)
  })

  it("mesma chave de clientes diferentes gera pedidos diferentes", async () => {
    const idempotencyKey = key()
    const a = await parseOrder(await createOrder((await newUser()).cookie, orderBody, idempotencyKey))
    const b = await parseOrder(await createOrder((await newUser()).cookie, orderBody, idempotencyKey))
    expect(a.id).not.toBe(b.id)
  })

  it("cria um único pedido quando a mesma chave chega em paralelo", async () => {
    const { cookie } = await newUser()
    const idempotencyKey = key()
    const responses = await Promise.all(Array.from({ length: 5 }, () => createOrder(cookie, orderBody, idempotencyKey)))
    expect(responses.map((response) => response.status).sort()).toEqual([200, 200, 200, 200, 201])
    const ids = new Set(await Promise.all(responses.map(async (response) => (await parseOrder(response)).id)))
    expect(ids.size).toBe(1)
  })

  it("rejeita total divergente da cotação atual com 409", async () => {
    const { cookie } = await newUser()
    const response = await createOrder(cookie, { ...orderBody, expectedTotalCents: 1 })
    expect(response.status).toBe(409)
    expect(((await response.json()) as { error: { fields: Record<string, string[]> } }).error.fields).toEqual({
      expectedTotalCents: ["total atual: 8170"],
    })
  })

  it("rejeita restaurante fechado e entrega sem endereço", async () => {
    const { cookie } = await newUser()
    await env.DB.prepare("update restaurants set is_open = 0 where id = 'rest_pizzaria'").run()
    const closed = await createOrder(cookie, {
      ...orderBody,
      restaurantId: "rest_pizzaria",
      items: [{ productId: "prod_pz_carne", quantity: 1, addonOptionIds: [] }],
    })
    expect(closed.status).toBe(400)
    const withoutAddress = Object.fromEntries(Object.entries(orderBody).filter(([field]) => field !== "address"))
    expect((await createOrder(cookie, withoutAddress)).status).toBe(400)
  })
})

describe("leitura de pedidos", () => {
  it("dono, equipe do restaurante e administração leem; outros recebem 404", async () => {
    const owner = await newUser()
    const order = await parseOrder(await createOrder(owner.cookie))

    const read = (cookie: string) => call(`/v1/orders/${order.id}`, { headers: { cookie } })
    expect((await read(owner.cookie)).status).toBe(200)
    expect((await read((await newUser({ staffOf: "rest_burger" })).cookie)).status).toBe(200)
    expect((await read((await newUser("admin")).cookie)).status).toBe(200)
    expect((await read((await newUser()).cookie)).status).toBe(404)
    expect((await read((await newUser({ staffOf: "rest_pizzaria" })).cookie)).status).toBe(404)
  })

  it("lista só os pedidos do próprio cliente", async () => {
    const a = await newUser()
    const b = await newUser()
    await createOrder(a.cookie)
    await createOrder(a.cookie)
    await createOrder(b.cookie)
    const response = await call("/v1/orders", { headers: { cookie: a.cookie } })
    const { data } = envelope(z.array(Order)).parse(await response.json())
    expect(data).toHaveLength(2)
    expect(data?.every((order) => order.customerId !== undefined)).toBe(true)
  })

  it("a fila do restaurante mostra só os pedidos dele", async () => {
    const customer = await newUser()
    const order = await parseOrder(await createOrder(customer.cookie))
    const staff = await newUser({ staffOf: "rest_burger" })
    const queue = await call("/v1/manage/restaurants/rest_burger/orders", { headers: { cookie: staff.cookie } })
    const { data } = envelope(z.array(Order)).parse(await queue.json())
    expect(data?.map((item) => item.id)).toContain(order.id)
    expect(data?.every((item) => item.restaurantId === "rest_burger")).toBe(true)

    const otherStaff = await newUser({ staffOf: "rest_pizzaria" })
    expect(
      (await call("/v1/manage/restaurants/rest_burger/orders", { headers: { cookie: otherStaff.cookie } })).status,
    ).toBe(403)
  })
})

describe("transições de status", () => {
  it("percorre o fluxo de entrega com o papel certo em cada etapa", async () => {
    const customer = await newUser()
    const staff = await newUser({ staffOf: "rest_burger" })
    const courier = await newUser("courier")
    const order = await parseOrder(await createOrder(customer.cookie))

    for (const [cookie, to] of [
      [staff.cookie, "accepted"],
      [staff.cookie, "preparing"],
      [staff.cookie, "ready"],
      [courier.cookie, "dispatched"],
      [courier.cookie, "delivered"],
    ] as const) {
      const response = await transition(cookie, order.id, to)
      expect(response.status, `-> ${to}`).toBe(200)
    }

    const final = await parseOrder(await call(`/v1/orders/${order.id}`, { headers: { cookie: customer.cookie } }))
    expect(final.status).toBe("delivered")
    expect(final.timeline.map((event) => [event.status, event.actorRole])).toEqual([
      ["pending", "customer"],
      ["accepted", "restaurant_staff"],
      ["preparing", "restaurant_staff"],
      ["ready", "restaurant_staff"],
      ["dispatched", "courier"],
      ["delivered", "courier"],
    ])
  })

  it("cliente cancela o próprio pedido pendente, mas não aceita", async () => {
    const customer = await newUser()
    const order = await parseOrder(await createOrder(customer.cookie))
    expect((await transition(customer.cookie, order.id, "accepted")).status).toBe(403)
    expect((await transition(customer.cookie, order.id, "cancelled")).status).toBe(200)
    expect((await transition(customer.cookie, order.id, "pending")).status).toBe(409)
  })

  it("rejeita pular etapa, repetir status e equipe de outro restaurante", async () => {
    const customer = await newUser()
    const staff = await newUser({ staffOf: "rest_burger" })
    const order = await parseOrder(await createOrder(customer.cookie))
    expect((await transition(staff.cookie, order.id, "ready")).status).toBe(409)
    expect((await transition(staff.cookie, order.id, "accepted")).status).toBe(200)
    expect((await transition(staff.cookie, order.id, "accepted")).status).toBe(409)
    const otherStaff = await newUser({ staffOf: "rest_pizzaria" })
    expect((await transition(otherStaff.cookie, order.id, "preparing")).status).toBe(404)
  })

  it("só uma de duas transições concorrentes vence, sem evento duplicado", async () => {
    const customer = await newUser()
    const staff = await newUser({ staffOf: "rest_burger" })
    const order = await parseOrder(await createOrder(customer.cookie))

    const results = await Promise.all([
      transition(staff.cookie, order.id, "accepted"),
      transition(staff.cookie, order.id, "accepted"),
      transition(customer.cookie, order.id, "cancelled"),
    ])
    expect(results.filter((response) => response.status === 200)).toHaveLength(1)

    const events = await env.DB.prepare("select status from order_events where order_id = ?").bind(order.id).all()
    expect(events.results).toHaveLength(2)
  })
})
