import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { signTicket, verifyTicket } from "../src/live-ticket"
import { call, newUser, postJson } from "./helpers"

const orderBody = {
  restaurantId: "rest_burger",
  fulfillment: "pickup",
  items: [{ productId: "prod_bg_classico", quantity: 1, addonOptionIds: ["opt_bg_ponto"] }],
  paymentMethod: "cash",
  expectedTotalCents: 3290,
}

type LiveMessage = { seq: number; type: string; orderId: string; status: string; at: string }

async function ticketFor(cookie: string, body: unknown) {
  const response = await postJson("/v1/live/tickets", body, { cookie })
  return { response, ticket: response.ok ? ((await response.json()) as { data: { ticket: string } }).data.ticket : "" }
}

/** Abre o WebSocket e coleta as mensagens recebidas. */
async function connect(ticket: string, since?: number) {
  const query = new URLSearchParams({ ticket, ...(since !== undefined ? { since: String(since) } : {}) })
  const response = await call(`/v1/live?${query}`, { headers: { upgrade: "websocket" } })
  expect(response.status).toBe(101)
  const socket = response.webSocket
  if (!socket) throw new Error("sem WebSocket")
  socket.accept()
  const messages: LiveMessage[] = []
  socket.addEventListener("message", (event) => {
    if (event.data !== "pong") messages.push(JSON.parse(String(event.data)) as LiveMessage)
  })
  return { socket, messages }
}

const waitFor = async (predicate: () => boolean, timeoutMs = 2000) => {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error("tempo esgotado esperando mensagem")
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

async function createOrder(cookie: string) {
  const response = await postJson("/v1/orders", orderBody, {
    cookie,
    "idempotency-key": `chave-${crypto.randomUUID()}`,
  })
  expect(response.status).toBe(201)
  return ((await response.json()) as { data: { id: string } }).data.id
}

describe("tickets de tempo real", () => {
  it("assina e valida; rejeita assinatura adulterada, segredo errado e expirado", async () => {
    const scope = { scope: "restaurant" as const, restaurantId: "rest_burger", sub: "u1" }
    const token = await signTicket("segredo", scope, 1_000_000)
    expect(await verifyTicket("segredo", token, 1_000_000)).toMatchObject(scope)
    expect(await verifyTicket("outro-segredo", token, 1_000_000)).toBeNull()
    expect(await verifyTicket("segredo", `${token}x`, 1_000_000)).toBeNull()
    expect(await verifyTicket("segredo", "a.b.c", 1_000_000)).toBeNull()
    expect(await verifyTicket("segredo", token, 1_000_000 + 61_000)).toBeNull()
  })

  it("só emite ticket de restaurante para a equipe e de pedido para quem o vê", async () => {
    const customer = await newUser()
    const otherCustomer = await newUser()
    const staff = await newUser({ staffOf: "rest_burger" })
    const orderId = await createOrder(customer.cookie)

    expect((await postJson("/v1/live/tickets", { scope: "restaurant", restaurantId: "rest_burger" })).status).toBe(401)
    expect(
      (await ticketFor(customer.cookie, { scope: "restaurant", restaurantId: "rest_burger" })).response.status,
    ).toBe(403)
    expect((await ticketFor(staff.cookie, { scope: "restaurant", restaurantId: "rest_burger" })).response.status).toBe(
      200,
    )
    expect((await ticketFor(customer.cookie, { scope: "order", orderId })).response.status).toBe(200)
    expect((await ticketFor(otherCustomer.cookie, { scope: "order", orderId })).response.status).toBe(404)
  }, 30_000)

  it("recusa conexão sem upgrade ou com ticket inválido", async () => {
    expect((await call("/v1/live?ticket=x")).status).toBe(400)
    const response = await call("/v1/live?ticket=forjado.ticket", { headers: { upgrade: "websocket" } })
    expect(response.status).toBe(401)
  })
})

describe("eventos em tempo real", () => {
  it("equipe recebe pedidos novos e mudanças; cliente recebe só o próprio pedido", async () => {
    const staff = await newUser({ staffOf: "rest_burger" })
    const customer = await newUser()
    const otherCustomer = await newUser()

    const restaurantFeed = await connect(
      (await ticketFor(staff.cookie, { scope: "restaurant", restaurantId: "rest_burger" })).ticket,
    )

    const orderId = await createOrder(customer.cookie)
    const otherOrderId = await createOrder(otherCustomer.cookie)
    await waitFor(() => restaurantFeed.messages.length >= 2)
    expect(restaurantFeed.messages.map((message) => [message.type, message.orderId])).toEqual([
      ["order.created", orderId],
      ["order.created", otherOrderId],
    ])

    const orderFeed = await connect((await ticketFor(customer.cookie, { scope: "order", orderId })).ticket)
    await postJson(`/v1/orders/${otherOrderId}/transitions`, { to: "accepted" }, { cookie: staff.cookie })
    await postJson(`/v1/orders/${orderId}/transitions`, { to: "accepted" }, { cookie: staff.cookie })

    await waitFor(() => orderFeed.messages.length >= 1 && restaurantFeed.messages.length >= 4)
    expect(orderFeed.messages.map((message) => [message.orderId, message.status])).toEqual([[orderId, "accepted"]])
    expect(restaurantFeed.messages.at(-1)).toMatchObject({ type: "order.updated", orderId, status: "accepted" })

    restaurantFeed.socket.close()
    orderFeed.socket.close()
  })

  it("reenvia na reconexão os eventos perdidos depois do último seq", async () => {
    const staff = await newUser({ staffOf: "rest_burger" })
    const customer = await newUser()
    const ticket = () => ticketFor(staff.cookie, { scope: "restaurant", restaurantId: "rest_burger" })

    const first = await connect((await ticket()).ticket)
    await createOrder(customer.cookie)
    await waitFor(() => first.messages.length >= 1)
    const lastSeen = first.messages.at(-1)?.seq ?? 0
    first.socket.close()

    const missedA = await createOrder(customer.cookie)
    const missedB = await createOrder(customer.cookie)

    const resumed = await connect((await ticket()).ticket, lastSeen)
    await waitFor(() => resumed.messages.length >= 2)
    expect(resumed.messages.map((message) => message.orderId)).toEqual([missedA, missedB])
    expect(resumed.messages.every((message) => message.seq > lastSeen)).toBe(true)
    resumed.socket.close()
  })

  it("responde ping sem acordar o objeto", async () => {
    const staff = await newUser({ staffOf: "rest_pizzaria" })
    const { socket } = await connect(
      (await ticketFor(staff.cookie, { scope: "restaurant", restaurantId: "rest_pizzaria" })).ticket,
    )
    const pong = new Promise((resolve) => socket.addEventListener("message", (event) => resolve(event.data)))
    socket.send("ping")
    expect(await pong).toBe("pong")
    socket.close()
  })

  it("isola os restaurantes: a pizzaria recebe o próprio pedido e não o da hamburgueria", async () => {
    const pizzariaStaff = await newUser({ staffOf: "rest_pizzaria" })
    const feed = await connect(
      (await ticketFor(pizzariaStaff.cookie, { scope: "restaurant", restaurantId: "rest_pizzaria" })).ticket,
    )
    const pizzaOrder = await postJson(
      "/v1/orders",
      {
        restaurantId: "rest_pizzaria",
        fulfillment: "pickup",
        items: [{ productId: "prod_pz_frango", quantity: 1, addonOptionIds: [] }],
        paymentMethod: "cash",
        expectedTotalCents: 4590,
      },
      { cookie: (await newUser()).cookie, "idempotency-key": `chave-${crypto.randomUUID()}` },
    )
    const pizzaId = ((await pizzaOrder.json()) as { data: { id: string } }).data.id
    await waitFor(() => feed.messages.some((message) => message.orderId === pizzaId))

    await createOrder((await newUser()).cookie)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(feed.messages.map((message) => message.orderId)).toEqual([pizzaId])
    feed.socket.close()
  })

  it("since=0 reenvia desde o início (cursor zero não é cursor ausente)", async () => {
    const customer = await newUser()
    const staff = await newUser({ staffOf: "rest_burger" })
    const orderId = await createOrder(customer.cookie)
    const { socket, messages } = await connect(
      (await ticketFor(staff.cookie, { scope: "restaurant", restaurantId: "rest_burger" })).ticket,
      0,
    )
    // O storage do objeto é compartilhado entre testes do arquivo: procura o pedido deste teste.
    await waitFor(() => messages.some((message) => message.orderId === orderId))
    expect(messages.find((message) => message.orderId === orderId)).toMatchObject({ type: "order.created" })
    socket.close()
  })

  it("descarta evento atrasado: um status mais antigo não chega depois do mais novo", async () => {
    const staff = await newUser({ staffOf: "rest_burger" })
    const room = env.RESTAURANT_ROOM.getByName("rest_burger")
    const feed = await connect(
      (await ticketFor(staff.cookie, { scope: "restaurant", restaurantId: "rest_burger" })).ticket,
    )
    await room.publish({
      type: "order.updated",
      orderId: "ord-ordem",
      status: "preparing",
      at: "2026-01-02T00:00:00.000Z",
    })
    await room.publish({
      type: "order.updated",
      orderId: "ord-ordem",
      status: "accepted",
      at: "2026-01-01T00:00:00.000Z",
    })
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(feed.messages.map((message) => [message.status, message.at])).toEqual([
      ["preparing", "2026-01-02T00:00:00.000Z"],
    ])
    feed.socket.close()
  })

  it("encerra o socket da equipe quando o vínculo é revogado e não envia mais eventos", async () => {
    const customer = await newUser()
    const staff = await newUser({ staffOf: "rest_burger" })
    const feed = await connect(
      (await ticketFor(staff.cookie, { scope: "restaurant", restaurantId: "rest_burger" })).ticket,
    )
    let closeCode = 0
    feed.socket.addEventListener("close", (event) => {
      closeCode = event.code
    })
    await env.DB.prepare("delete from restaurant_members where user_id = ?").bind(staff.userId).run()
    await createOrder(customer.cookie)
    await waitFor(() => closeCode !== 0)
    expect(closeCode).toBe(4403)
    expect(feed.messages).toEqual([])
  })
})
