import { Order, envelope } from "@delivery/contracts"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { call, newUser, postJson } from "./helpers"

const address = {
  street: "Rua das Flores",
  number: "120",
  district: "Centro",
  city: "São João Batista do Glória",
  state: "MG",
  postalCode: "37920-000",
}
// Burger clássico (32,90) + ao ponto + bacon (5,00) = 37,90; entrega 5,90.
const orderBody = {
  restaurantId: "rest_burger",
  fulfillment: "delivery",
  items: [{ productId: "prod_bg_classico", quantity: 1, addonOptionIds: ["opt_bg_ponto", "opt_bg_bacon"] }],
  paymentMethod: "cash",
  expectedTotalCents: 3790 + 590,
  address,
}

const list = async (cookie: string) => {
  const response = await call("/v1/courier/orders", { headers: { cookie } })
  return {
    response,
    orders: response.ok ? (envelope(z.array(Order)).parse(await response.json()).data as Order[]) : [],
  }
}
const move = (cookie: string, orderId: string, to: string) =>
  postJson(`/v1/orders/${orderId}/transitions`, { to }, { cookie })

async function readyOrder() {
  const customer = await newUser()
  const staff = await newUser({ staffOf: "rest_burger" })
  const created = await postJson("/v1/orders", orderBody, {
    cookie: customer.cookie,
    "idempotency-key": `chave-${crypto.randomUUID()}`,
  })
  const order = envelope(Order).parse(await created.json()).data as Order
  for (const to of ["accepted", "preparing", "ready"]) expect((await move(staff.cookie, order.id, to)).status).toBe(200)
  return { order, customer }
}

describe("GET /v1/courier/orders", () => {
  it("exige sessão e papel de entregador", async () => {
    expect((await call("/v1/courier/orders")).status).toBe(401)
    const customer = await newUser()
    expect((await list(customer.cookie)).response.status).toBe(403)
    const staff = await newUser({ staffOf: "rest_burger" })
    expect((await list(staff.cookie)).response.status).toBe(403)
  })

  it("mostra pedidos de entrega prontos e acompanha a entrega que o próprio entregador despachou", async () => {
    const { order } = await readyOrder()
    const courier = await newUser("courier")
    const other = await newUser("courier")

    expect((await list(courier.cookie)).orders.map((item) => item.id)).toContain(order.id)

    expect((await move(courier.cookie, order.id, "dispatched")).status).toBe(200)

    // Despachado: some da lista de disponíveis, fica só com quem despachou.
    expect((await list(courier.cookie)).orders.map((item) => item.id)).toContain(order.id)
    expect((await list(other.cookie)).orders.map((item) => item.id)).not.toContain(order.id)

    expect((await move(courier.cookie, order.id, "delivered")).status).toBe(200)
    expect((await list(courier.cookie)).orders.map((item) => item.id)).not.toContain(order.id)
  })

  it("não lista retirada nem pedido ainda em preparo", async () => {
    const customer = await newUser()
    const created = await postJson("/v1/orders", orderBody, {
      cookie: customer.cookie,
      "idempotency-key": `chave-${crypto.randomUUID()}`,
    })
    const order = envelope(Order).parse(await created.json()).data as Order
    const courier = await newUser("courier")
    expect((await list(courier.cookie)).orders.map((item) => item.id)).not.toContain(order.id)
  })
})
