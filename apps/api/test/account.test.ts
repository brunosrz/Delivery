import { AccountExport, DELETE_ACCOUNT_CONFIRMATION, Order, envelope } from "@delivery/contracts"
import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { z } from "zod"
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
    const email = `exporta-${crypto.randomUUID().slice(0, 8)}@example.test`
    const { cookie, userId } = await signUp(email)
    const order = await createOrder(cookie)

    const response = await exportData(cookie)
    expect(response.status).toBe(200)
    const text = await response.text()
    const { data } = envelope(AccountExport).parse(JSON.parse(text))
    expect(data?.user).toMatchObject({ id: userId, email, name: "Pessoa Teste", role: "customer" })
    expect(Date.now() - Date.parse(data?.user.createdAt ?? "")).toBeLessThan(60_000)
    expect(data?.orders.map((item) => item.id)).toEqual([order.id])
    expect(data?.orders[0]?.address?.street).toBe("Rua das Flores")
    expect(data?.hasPaymentProfile).toBe(false)
    for (const secret of ["password", "token", "accessToken", "refreshToken"]) {
      expect(text.toLowerCase()).not.toContain(`"${secret.toLowerCase()}"`)
    }
  })

  it("informa que existe cadastro de cobrança, sem expor o identificador do Asaas", async () => {
    const { cookie, userId } = await newUser()
    await env.DB.prepare("insert into asaas_customers (user_id, asaas_customer_id) values (?, 'cus_segredo_1')")
      .bind(userId)
      .run()
    const text = await (await exportData(cookie)).text()
    expect(envelope(AccountExport).parse(JSON.parse(text)).data?.hasPaymentProfile).toBe(true)
    expect(text).not.toContain("cus_segredo_1")
  })

  it("exporta todos os pedidos, inclusive além do limite de 50 da listagem comum", async () => {
    const { cookie } = await newUser()
    const base = await createOrder(cookie)
    const row = await env.DB.prepare("select * from orders where id = ?").bind(base.id).first<Record<string, unknown>>()
    if (!row) throw new Error("pedido base ausente")
    const columns = Object.keys(row)
    const copies: Record<string, unknown>[] = Array.from({ length: 55 }, (_, n) => ({
      ...row,
      id: `${base.id}-copia-${n}`,
      idempotency_key: `copia-${n}-${crypto.randomUUID()}`,
    }))
    await env.DB.batch(
      copies.flatMap((copy) => [
        env.DB.prepare(`insert into orders (${columns.join(", ")}) values (${columns.map(() => "?").join(", ")})`).bind(
          ...columns.map((column) => copy[column]),
        ),
        env.DB.prepare(
          "insert into order_events (id, order_id, restaurant_id, status, actor_role, at) values (?, ?, ?, 'pending', 'customer', ?)",
        ).bind(`${String(copy.id)}-evento`, copy.id, row.restaurant_id, row.created_at),
      ]),
    )

    const { data } = envelope(AccountExport).parse(await (await exportData(cookie)).json())
    expect(data?.orders).toHaveLength(56)
    expect(new Set(data?.orders.map((item) => item.id)).size).toBe(56)
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

  it("anonimiza: sem login, sem e-mail, sem endereço real, mas com os pedidos guardados e válidos", async () => {
    const email = `exclusao-${crypto.randomUUID().slice(0, 8)}@example.test`
    const { cookie, userId } = await signUp(email)
    const cancelled = await createOrder(cookie)
    const delivered = await createOrder(cookie)
    await env.DB.prepare("update orders set status = 'cancelled' where id = ?").bind(cancelled.id).run()
    await env.DB.prepare("update orders set status = 'delivered' where id = ?").bind(delivered.id).run()
    await env.DB.batch([
      env.DB.prepare("insert into asaas_customers (user_id, asaas_customer_id) values (?, 'cus_1')").bind(userId),
      env.DB.prepare(
        "insert into verification (id, identifier, value, expires_at, created_at, updated_at) values ('v1', ?, 'x', ?, 0, 0)",
      ).bind(email, Date.now() + 60_000),
      env.DB.prepare(
        "insert into verification (id, identifier, value, expires_at, created_at, updated_at) values ('v2', 'reset-password:token-qualquer', ?, ?, 0, 0)",
      ).bind(userId, Date.now() + 60_000),
    ])

    const response = await deleteAccount(cookie)
    expect(response.status).toBe(200)
    expect(((await response.json()) as { data: { deleted: boolean } }).data.deleted).toBe(true)

    // A sessão antiga morreu e o login com a senha antiga é recusado (401, não um erro do servidor).
    expect((await call("/v1/me", { headers: { cookie } })).status).toBe(401)
    expect((await postJson("/api/auth/sign-in/email", { email, password: PASSWORD })).status).toBe(401)

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
    // Nem a verificação por e-mail nem o token de redefinição de senha (que guarda o id do usuário) sobram.
    const verifications = await env.DB.prepare(
      "select count(*) as n from verification where identifier = ? or value = ?",
    )
      .bind(email, userId)
      .first<{ n: number }>()
    expect(verifications?.n).toBe(0)

    // Os pedidos ficam, com o mesmo total, e o endereço real some.
    const kept = await env.DB.prepare(
      "select id, address_json as address, total_cents as total from orders where id in (?, ?)",
    )
      .bind(cancelled.id, delivered.id)
      .all<{ id: string; address: string; total: number }>()
    expect(kept.results).toHaveLength(2)
    for (const item of kept.results) {
      expect(item.total).toBe(3880)
      expect(item.address).not.toContain("Rua das Flores")
    }

    // A fila do restaurante continua válida no schema Order com o pedido anonimizado.
    const staff = await newUser({ staffOf: "rest_burger" })
    const queue = await call("/v1/manage/restaurants/rest_burger/orders", { headers: { cookie: staff.cookie } })
    expect(queue.status).toBe(200)
    const orders = envelope(z.array(Order)).parse(await queue.json()).data ?? []
    const anonymized = orders.filter((item) => [cancelled.id, delivered.id].includes(item.id))
    expect(anonymized).toHaveLength(2)
    for (const item of anonymized)
      expect(item.address).toMatchObject({ street: "Endereço removido", postalCode: "00000-000" })
  })
})
