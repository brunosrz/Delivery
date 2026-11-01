import { AccountExport, DELETE_ACCOUNT_CONFIRMATION, Order, envelope } from "@delivery/contracts"
import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { PASSWORD, call, newUser, postJson, signUp } from "./helpers"

const address = {
  street: "Rua das Flores",
  number: "120",
  district: "Centro",
  city: "São João Batista do Glória",
  state: "MG",
  postalCode: "37920-000",
}
// Burger clássico (32,90) + ao ponto + entrega 5,90.
const deliveryOrder = {
  restaurantId: "rest_burger",
  fulfillment: "delivery",
  items: [{ productId: "prod_bg_classico", quantity: 1, addonOptionIds: ["opt_bg_ponto"] }],
  paymentMethod: "cash",
  expectedTotalCents: 3290 + 590,
  address,
}

const createOrder = async (cookie: string) => {
  const response = await postJson("/v1/orders", deliveryOrder, {
    cookie,
    "idempotency-key": `chave-${crypto.randomUUID()}`,
  })
  expect(response.status).toBe(201)
  return envelope(Order).parse(await response.json()).data as Order
}
const exportData = (cookie?: string) => call("/v1/me/export", { headers: cookie ? { cookie } : {} })
const deleteAccount = (cookie: string, body: unknown = { confirm: DELETE_ACCOUNT_CONFIRMATION }) =>
  call("/v1/me", {
    method: "DELETE",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
  })

describe("GET /v1/me/export", () => {
  it("exige sessão", async () => {
    expect((await exportData()).status).toBe(401)
  })

  it("devolve os dados do titular e os pedidos, sem credenciais", async () => {
    const { cookie, userId } = await newUser()
    const order = await createOrder(cookie)

    const response = await exportData(cookie)
    expect(response.status).toBe(200)
    const text = await response.text()
    const { data } = envelope(AccountExport).parse(JSON.parse(text))
    expect(data?.user.id).toBe(userId)
    expect(data?.orders.map((item) => item.id)).toEqual([order.id])
    expect(data?.orders[0]?.address?.street).toBe("Rua das Flores")
    expect(data?.hasPaymentProfile).toBe(false)
    for (const secret of ["password", "token", "accessToken", "refreshToken"]) {
      expect(text.toLowerCase()).not.toContain(`"${secret.toLowerCase()}"`)
    }
  })

  it("não mostra pedidos de outro cliente", async () => {
    const first = await newUser()
    const second = await newUser()
    await createOrder(first.cookie)
    const { data } = envelope(AccountExport).parse(await (await exportData(second.cookie)).json())
    expect(data?.orders).toEqual([])
  })
})

describe("DELETE /v1/me", () => {
  it("exige sessão e a frase de confirmação", async () => {
    const anonymous = await call("/v1/me", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirm: DELETE_ACCOUNT_CONFIRMATION }),
    })
    expect(anonymous.status).toBe(401)
    const { cookie } = await newUser()
    expect((await deleteAccount(cookie, {})).status).toBe(400)
    expect((await deleteAccount(cookie, { confirm: "sim" })).status).toBe(400)
    expect((await exportData(cookie)).status).toBe(200)
  })

  it("só exclui conta de cliente", async () => {
    const courier = await newUser("courier")
    expect((await deleteAccount(courier.cookie)).status).toBe(403)
  })

  it("recusa enquanto há pedido em andamento e nada muda", async () => {
    const { cookie } = await newUser()
    await createOrder(cookie)
    const response = await deleteAccount(cookie)
    expect(response.status).toBe(409)
    expect((await exportData(cookie)).status).toBe(200)
  })

  it("anonimiza: sem login, sem e-mail, sem endereço, mas com o pedido guardado", async () => {
    const email = `exclusao-${crypto.randomUUID().slice(0, 8)}@example.test`
    const { cookie, userId } = await signUp(email)
    const order = await createOrder(cookie)
    await env.DB.prepare("update orders set status = 'cancelled' where id = ?").bind(order.id).run()
    await env.DB.prepare("insert into asaas_customers (user_id, asaas_customer_id) values (?, 'cus_1')")
      .bind(userId)
      .run()

    const response = await deleteAccount(cookie)
    expect(response.status).toBe(200)
    expect(((await response.json()) as { data: { deleted: boolean } }).data.deleted).toBe(true)

    // A sessão antiga morreu e o login com a senha antiga não funciona mais.
    expect((await call("/v1/me", { headers: { cookie } })).status).toBe(401)
    const login = await postJson("/api/auth/sign-in/email", { email, password: PASSWORD })
    expect(login.status).toBeGreaterThanOrEqual(400)

    const row = await env.DB.prepare("select name, email, email_verified as verified from user where id = ?")
      .bind(userId)
      .first<{ name: string; email: string; verified: number }>()
    expect(row).toMatchObject({ name: "Conta excluída", email: `excluido-${userId}@invalid.local`, verified: 0 })
    for (const table of ["session", "account", "asaas_customers"]) {
      const left = await env.DB.prepare(`select count(*) as n from ${table} where user_id = ?`)
        .bind(userId)
        .first<{ n: number }>()
      expect(left?.n, table).toBe(0)
    }

    const kept = await env.DB.prepare(
      "select id, address_json as address, total_cents as total from orders where id = ?",
    )
      .bind(order.id)
      .first<{ id: string; address: string | null; total: number }>()
    expect(kept).toMatchObject({ id: order.id, address: null, total: 3880 })
  })
})
