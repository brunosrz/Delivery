import { Order, envelope } from "@delivery/contracts"
import { env } from "cloudflare:workers"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { call, newUser, postJson } from "./helpers"

// Burger clássico (32,90) + ao ponto + bacon (5,00) = 37,90 por unidade; retirada, sem entrega.
const total = 2 * 3790
const payer = {
  name: "Maria da Silva",
  cpfCnpj: "249.715.637-92",
  email: "maria@example.test",
  mobilePhone: "(32) 99999-0000",
}
const orderBody = (paymentMethod: string, extra: Record<string, unknown> = { payer }) => ({
  restaurantId: "rest_burger",
  fulfillment: "pickup",
  items: [{ productId: "prod_bg_classico", quantity: 2, addonOptionIds: ["opt_bg_ponto", "opt_bg_bacon"] }],
  paymentMethod,
  expectedTotalCents: total,
  ...extra,
})

const WEBHOOK_TOKEN = "token-de-webhook-de-teste-com-32-caracteres!"
const key = () => `chave-${crypto.randomUUID()}`
const parseOrder = async (response: Response) => envelope(Order).parse(await response.json()).data as Order

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })

type FetchFn = (input: string | URL | Request, init?: RequestInit) => Promise<Response>
let asaas: ReturnType<typeof vi.fn<FetchFn>>

/** Asaas simulado: guarda as cobranças criadas para que a busca por externalReference as encontre. */
function installAsaas(options: { down?: boolean } = {}) {
  const payments = new Map<string, Record<string, unknown>>()
  asaas = vi.fn<FetchFn>(async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url)
    if (!url.hostname.endsWith("asaas.com")) throw new Error(`fetch inesperado: ${url.href}`)
    if (options.down) return json({}, 503)
    const method = init?.method ?? "GET"
    if (method === "POST" && url.pathname === "/v3/customers") return json({ id: "cus_000000001" })
    if (method === "GET" && url.pathname === "/v3/payments") {
      const reference = url.searchParams.get("externalReference") ?? ""
      return json({ data: payments.has(reference) ? [payments.get(reference)] : [] })
    }
    if (method === "POST" && url.pathname === "/v3/payments") {
      const body = JSON.parse(init?.body as string) as { externalReference: string; billingType: string; value: number }
      const payment = {
        id: `pay_${payments.size + 1}`,
        status: "PENDING",
        invoiceUrl: `https://www.asaas.com/i/${payments.size + 1}`,
        externalReference: body.externalReference,
        value: body.value,
        billingType: body.billingType,
      }
      payments.set(body.externalReference, payment)
      return json(payment)
    }
    if (method === "GET" && url.pathname.endsWith("/pixQrCode")) {
      return json({
        payload: "00020126pix-copia-e-cola",
        encodedImage: "iVBORw0KGgo=",
        expirationDate: "2026-12-31 23:59:59",
      })
    }
    return json({ errors: [{ code: "nao_simulado" }] }, 404)
  })
  vi.spyOn(globalThis, "fetch").mockImplementation(((input: string | URL | Request, init?: RequestInit) =>
    asaas(input, init)) as typeof fetch)
  return payments
}

const asaasCalls = (matcher: (method: string, path: string) => boolean) =>
  asaas.mock.calls.filter(([input, init]) => {
    const url = new URL(typeof input === "string" ? input : (input as URL).href)
    return matcher((init as RequestInit | undefined)?.method ?? "GET", url.pathname)
  })

const createOrder = (cookie: string, body: unknown) =>
  postJson("/v1/orders", body, { cookie, "idempotency-key": key() })

const webhook = (body: unknown, token: string | null = WEBHOOK_TOKEN) =>
  postJson("/v1/webhooks/asaas", body, token ? { "asaas-access-token": token } : {})

const event = (id: string, name: string, payment: Record<string, unknown>) => ({
  id,
  event: name,
  dateCreated: "2026-10-31 12:00:00",
  payment: { object: "payment", ...payment },
})

const paymentStatusOf = async (orderId: string) =>
  (
    await env.DB.prepare("select payment_status as status from orders where id = ?")
      .bind(orderId)
      .first<{ status: string }>()
  )?.status

afterEach(() => vi.restoreAllMocks())
beforeEach(() => vi.restoreAllMocks())

describe("pedido com Pix", () => {
  it("emite a cobrança no Asaas e devolve o QR Code, sem gravar CPF", async () => {
    installAsaas()
    const { cookie } = await newUser()
    const response = await createOrder(cookie, orderBody("pix"))
    expect(response.status).toBe(201)
    const order = await parseOrder(response)

    expect(order.payment).toEqual({ method: "pix", status: "pending" })
    expect(order.charge).toMatchObject({
      provider: "asaas",
      chargeId: "pay_1",
      pix: { payload: "00020126pix-copia-e-cola", qrCodeImage: "iVBORw0KGgo=" },
    })

    const [customer] = asaasCalls((method, path) => method === "POST" && path === "/v3/customers")
    const [url, init] = customer as [string, RequestInit & { headers: Record<string, string> }]
    expect(url).toBe("https://api-sandbox.asaas.com/v3/customers")
    expect(init.headers.access_token).toBe("$aact_hmlg_test-key")
    expect(init.headers["user-agent"]).toBeTruthy()
    expect(JSON.parse(init.body as string)).toMatchObject({ name: "Maria da Silva", cpfCnpj: "24971563792" })

    const [paymentCall] = asaasCalls((method, path) => method === "POST" && path === "/v3/payments")
    expect(JSON.parse((paymentCall?.[1] as RequestInit).body as string)).toMatchObject({
      customer: "cus_000000001",
      billingType: "PIX",
      value: 75.8,
      externalReference: order.id,
    })

    const stored = await env.DB.prepare("select count(*) as n from payment_charges where order_id = ?")
      .bind(order.id)
      .first<{ n: number }>()
    expect(stored?.n).toBe(1)
  })

  it("repetir a criação com a mesma Idempotency-Key não cobra de novo", async () => {
    installAsaas()
    const { cookie } = await newUser()
    const idempotencyKey = key()
    const first = await postJson("/v1/orders", orderBody("pix"), { cookie, "idempotency-key": idempotencyKey })
    const second = await postJson("/v1/orders", orderBody("pix"), { cookie, "idempotency-key": idempotencyKey })
    expect(second.status).toBe(200)
    expect((await parseOrder(second)).charge?.chargeId).toBe((await parseOrder(first)).charge?.chargeId)
    expect(asaasCalls((method, path) => method === "POST" && path === "/v3/payments")).toHaveLength(1)
  })

  it("exige os dados do pagador no pagamento online", async () => {
    installAsaas()
    const { cookie } = await newUser()
    const response = await createOrder(cookie, orderBody("pix", {}))
    expect(response.status).toBe(400)
    expect(asaas).not.toHaveBeenCalled()
  })

  it("rejeita CPF inválido", async () => {
    installAsaas()
    const { cookie } = await newUser()
    const response = await createOrder(cookie, orderBody("pix", { payer: { ...payer, cpfCnpj: "123" } }))
    expect(response.status).toBe(400)
  })
})

describe("pedido com cartão (crédito ou débito)", () => {
  it("usa a fatura hospedada do Asaas e nunca recebe dados de cartão", async () => {
    installAsaas()
    const { cookie } = await newUser()
    const response = await createOrder(cookie, orderBody("card"))
    const order = await parseOrder(response)
    expect(order.charge).toMatchObject({ chargeId: "pay_1", invoiceUrl: "https://www.asaas.com/i/1", pix: null })

    const [paymentCall] = asaasCalls((method, path) => method === "POST" && path === "/v3/payments")
    const body = JSON.parse((paymentCall?.[1] as RequestInit).body as string)
    expect(body.billingType).toBe("UNDEFINED")
    expect(body).not.toHaveProperty("creditCard")
    expect(asaasCalls((_method, path) => path.endsWith("/pixQrCode"))).toHaveLength(0)
  })

  it("rejeita campos de cartão no pedido", async () => {
    installAsaas()
    const { cookie } = await newUser()
    const response = await createOrder(cookie, orderBody("card", { payer, creditCard: { number: "4444444444444444" } }))
    expect(response.status).toBe(400)
  })
})

describe("falha do Asaas", () => {
  it("mantém o pedido pendente sem cobrança e permite tentar de novo sem duplicar", async () => {
    installAsaas({ down: true })
    const { cookie } = await newUser()
    const created = await createOrder(cookie, orderBody("pix"))
    expect(created.status).toBe(201)
    const order = await parseOrder(created)
    expect(order.charge).toBeUndefined()
    expect(order.payment.status).toBe("pending")

    installAsaas()
    const retry = await postJson(`/v1/orders/${order.id}/payment`, { payer }, { cookie })
    expect(retry.status).toBe(200)
    expect((await parseOrder(retry)).charge?.pix?.payload).toBe("00020126pix-copia-e-cola")

    const again = await postJson(`/v1/orders/${order.id}/payment`, {}, { cookie })
    expect(again.status).toBe(200)
    expect(asaasCalls((method, path) => method === "POST" && path === "/v3/payments")).toHaveLength(1)
  })

  it("não deixa outro cliente emitir cobrança do pedido", async () => {
    installAsaas({ down: true })
    const owner = await newUser()
    const order = await parseOrder(await createOrder(owner.cookie, orderBody("pix")))
    const stranger = await newUser()
    const response = await postJson(`/v1/orders/${order.id}/payment`, { payer }, { cookie: stranger.cookie })
    expect(response.status).toBe(404)
  })

  it("recusa cobrança para pedido pago na entrega", async () => {
    installAsaas()
    const { cookie } = await newUser()
    const order = await parseOrder(await createOrder(cookie, orderBody("cash", {})))
    const response = await postJson(`/v1/orders/${order.id}/payment`, { payer }, { cookie })
    expect(response.status).toBe(400)
  })
})

describe("POST /v1/webhooks/asaas", () => {
  async function orderWithCharge() {
    installAsaas()
    const { cookie } = await newUser()
    const order = await parseOrder(await createOrder(cookie, orderBody("pix")))
    return { cookie, order, chargeId: order.charge?.chargeId ?? "" }
  }

  it("rejeita token ausente ou errado", async () => {
    const { order, chargeId } = await orderWithCharge()
    const body = event("evt_1", "PAYMENT_RECEIVED", { id: chargeId })
    expect((await webhook(body, null)).status).toBe(401)
    expect((await webhook(body, "outro-token")).status).toBe(401)
    expect(await paymentStatusOf(order.id)).toBe("pending")
  })

  it("confirma o pagamento uma única vez mesmo com reenvios e em paralelo", async () => {
    const { order, chargeId } = await orderWithCharge()
    const body = event("evt_paid_1", "PAYMENT_RECEIVED", { id: chargeId, value: 75.8 })
    const responses = await Promise.all([1, 2, 3, 4, 5].map(() => webhook(body)))
    for (const response of responses) expect(response.status).toBe(200)
    expect(await paymentStatusOf(order.id)).toBe("paid")
    const events = await env.DB.prepare("select count(*) as n from payment_webhook_events where event_id = ?")
      .bind("evt_paid_1")
      .first<{ n: number }>()
    expect(events?.n).toBe(1)
  })

  it("ignora campos desconhecidos no payload", async () => {
    const { order, chargeId } = await orderWithCharge()
    const response = await webhook({
      ...event("evt_extra_1", "PAYMENT_CONFIRMED", { id: chargeId, novoCampo: { x: 1 } }),
      campoNovo: true,
    })
    expect(response.status).toBe(200)
    expect(await paymentStatusOf(order.id)).toBe("paid")
  })

  it("estorno só vale depois do pagamento; antes disso o evento é reconhecido e ignorado", async () => {
    const { order, chargeId } = await orderWithCharge()
    expect((await webhook(event("evt_ref_early", "PAYMENT_REFUNDED", { id: chargeId }))).status).toBe(200)
    expect(await paymentStatusOf(order.id)).toBe("pending")

    await webhook(event("evt_pay", "PAYMENT_RECEIVED", { id: chargeId }))
    await webhook(event("evt_ref", "PAYMENT_REFUNDED", { id: chargeId }))
    expect(await paymentStatusOf(order.id)).toBe("refunded")
  })

  it("marca falha em cobrança vencida e permite pagamento posterior", async () => {
    const { order, chargeId } = await orderWithCharge()
    await webhook(event("evt_over", "PAYMENT_OVERDUE", { id: chargeId }))
    expect(await paymentStatusOf(order.id)).toBe("failed")
    await webhook(event("evt_late", "PAYMENT_RECEIVED", { id: chargeId }))
    expect(await paymentStatusOf(order.id)).toBe("paid")
  })

  it("não aplica evento com valor diferente do pedido", async () => {
    const { order, chargeId } = await orderWithCharge()
    const response = await webhook(event("evt_value", "PAYMENT_RECEIVED", { id: chargeId, value: 1 }))
    expect(response.status).toBe(200)
    expect(await paymentStatusOf(order.id)).toBe("pending")
  })

  it("reconhece (200) cobrança desconhecida e evento sem efeito, sem alterar pedidos", async () => {
    const { order, chargeId } = await orderWithCharge()
    expect((await webhook(event("evt_unknown", "PAYMENT_RECEIVED", { id: "pay_de_outro_sistema" }))).status).toBe(200)
    expect((await webhook(event("evt_view", "PAYMENT_CHECKOUT_VIEWED", { id: chargeId }))).status).toBe(200)
    expect(await paymentStatusOf(order.id)).toBe("pending")
  })

  it("rejeita corpo que não é um evento", async () => {
    expect((await webhook({ foo: "bar" })).status).toBe(400)
    const raw = await call("/v1/webhooks/asaas", {
      method: "POST",
      headers: { "asaas-access-token": WEBHOOK_TOKEN },
      body: "não é json",
    })
    expect(raw.status).toBe(400)
  })
})
