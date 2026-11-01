import { Order, Quote, Restaurant, envelope } from "@delivery/contracts"
import { env } from "cloudflare:workers"
import { beforeEach, describe, expect, it } from "vitest"
import { z } from "zod"
import { TENANT_GRACE_DAYS, purgeSuspendedTenants } from "../src/tenant"
import { call, newUser, postJson } from "./helpers"

const DAY = 24 * 60 * 60 * 1000
const suspend = (cookie: string | undefined, restaurantId: string) =>
  call(`/v1/admin/restaurants/${restaurantId}/suspend`, { method: "POST", headers: cookie ? { cookie } : {} })
const restore = (cookie: string | undefined, restaurantId: string) =>
  call(`/v1/admin/restaurants/${restaurantId}/restore`, { method: "POST", headers: cookie ? { cookie } : {} })
const orderBody = {
  restaurantId: "rest_burger",
  fulfillment: "pickup",
  items: [{ productId: "prod_bg_classico", quantity: 1, addonOptionIds: ["opt_bg_ponto"] }],
  paymentMethod: "cash",
  expectedTotalCents: 3290,
}
const placeOrder = async (cookie: string) => {
  const response = await postJson("/v1/orders", orderBody, {
    cookie,
    "idempotency-key": `chave-${crypto.randomUUID()}`,
  })
  expect(response.status).toBe(201)
  return envelope(Order).parse(await response.json()).data as Order
}
const restaurantSlugs = async () =>
  (envelope(z.array(Restaurant)).parse(await (await call("/v1/restaurants")).json()).data ?? []).map(
    (item) => item.slug,
  )
const count = async (sql: string, ...binds: unknown[]) =>
  (
    await env.DB.prepare(sql)
      .bind(...binds)
      .first<{ n: number }>()
  )?.n
const markDeleted = (restaurantId: string, daysAgo: number) =>
  env.DB.prepare("update restaurants set deleted_at = ? where id = ?")
    .bind(new Date(Date.now() - daysAgo * DAY).toISOString(), restaurantId)
    .run()

// O D1 é compartilhado entre os testes do arquivo: cada teste começa com os restaurantes do seed ativos.
beforeEach(async () => {
  await env.DB.prepare("update restaurants set deleted_at = null, purged_at = null where purged_at is null").run()
})

describe("exclusão recuperável de restaurante: acesso", () => {
  it("exige sessão e papel de administração", async () => {
    expect((await suspend(undefined, "rest_pizzaria")).status).toBe(401)
    expect((await restore(undefined, "rest_pizzaria")).status).toBe(401)
    const customer = await newUser()
    const staff = await newUser({ staffOf: "rest_pizzaria" })
    const courier = await newUser("courier")
    for (const who of [customer, staff, courier]) {
      expect((await suspend(who.cookie, "rest_pizzaria")).status).toBe(403)
      expect((await restore(who.cookie, "rest_pizzaria")).status).toBe(403)
    }
    // Nada mudou.
    expect(await restaurantSlugs()).toContain("pizzaria-da-praca")
  })

  it("restaurante inexistente dá 404 e restaurar quem não está excluído dá 409", async () => {
    const admin = await newUser("admin")
    expect((await suspend(admin.cookie, "nao-existe")).status).toBe(404)
    expect((await restore(admin.cookie, "nao-existe")).status).toBe(404)
    expect((await restore(admin.cookie, "rest_pizzaria")).status).toBe(409)
  })
})

describe("suspensão", () => {
  it("esconde do catálogo, recusa cotação e pedido novo e informa até quando dá para restaurar", async () => {
    const admin = await newUser("admin")
    const customer = await newUser()

    const response = await suspend(admin.cookie, "rest_burger")
    expect(response.status).toBe(200)
    const { data } = (await response.json()) as {
      data: { restaurantId: string; deletedAt: string; purgeAfter: string }
    }
    expect(data.restaurantId).toBe("rest_burger")
    expect(Date.parse(data.purgeAfter) - Date.parse(data.deletedAt)).toBe(TENANT_GRACE_DAYS * DAY)

    expect(await restaurantSlugs()).not.toContain("burger-do-bairro")
    expect((await call("/v1/restaurants/burger-do-bairro/menu")).status).toBe(404)
    const quote = await postJson("/v1/quotes", {
      restaurantId: "rest_burger",
      fulfillment: "pickup",
      items: orderBody.items,
    })
    expect(quote.status).toBe(404)
    const order = await postJson("/v1/orders", orderBody, {
      cookie: customer.cookie,
      "idempotency-key": `chave-${crypto.randomUUID()}`,
    })
    expect(order.status).toBe(404)
    // Os outros restaurantes seguem normais.
    expect(await restaurantSlugs()).toContain("pizzaria-da-praca")
    expect(
      envelope(Quote).safeParse(
        await (
          await postJson("/v1/quotes", {
            restaurantId: "rest_pizzaria",
            fulfillment: "pickup",
            items: [{ productId: "prod_pz_carne", quantity: 1, addonOptionIds: [] }],
          })
        ).json(),
      ).success,
    ).toBe(true)
  })

  it("excluir duas vezes dá 409", async () => {
    const admin = await newUser("admin")
    expect((await suspend(admin.cookie, "rest_pizzaria")).status).toBe(200)
    expect((await suspend(admin.cookie, "rest_pizzaria")).status).toBe(409)
  })

  it("a equipe perde o acesso à gestão, aos pedidos e ao tempo real; a administração mantém", async () => {
    const admin = await newUser("admin")
    const staff = await newUser({ staffOf: "rest_burger" })
    const customer = await newUser()
    const order = await placeOrder(customer.cookie)

    const asStaff = (path: string) => call(path, { headers: { cookie: staff.cookie } })
    expect((await asStaff("/v1/manage/restaurants/rest_burger/orders")).status).toBe(200)

    await suspend(admin.cookie, "rest_burger")

    expect((await asStaff("/v1/manage/restaurants/rest_burger/orders")).status).toBe(403)
    expect((await asStaff("/v1/manage/restaurants/rest_burger/mkit/metrics")).status).toBe(403)
    expect((await asStaff("/v1/manage/restaurants/rest_burger")).status).toBe(403)
    const transition = await postJson(
      `/v1/orders/${order.id}/transitions`,
      { to: "accepted" },
      { cookie: staff.cookie },
    )
    expect(transition.status).toBe(403)
    const ticket = (cookie: string) =>
      postJson("/v1/live/tickets", { scope: "restaurant", restaurantId: "rest_burger" }, { cookie })
    expect((await ticket(staff.cookie)).status).toBe(403)

    // A administração ainda enxerga e resolve o que ficou pendente.
    expect(
      (await call("/v1/manage/restaurants/rest_burger/orders", { headers: { cookie: admin.cookie } })).status,
    ).toBe(200)
    expect((await ticket(admin.cookie)).status).toBe(200)
    expect(
      (await postJson(`/v1/orders/${order.id}/transitions`, { to: "cancelled" }, { cookie: admin.cookie })).status,
    ).toBe(200)
    // O cliente continua vendo o próprio pedido.
    expect((await call(`/v1/orders/${order.id}`, { headers: { cookie: customer.cookie } })).status).toBe(200)
  })

  it("cancela os jobs pendentes da caixa de saída e deixa os de outros restaurantes", async () => {
    const admin = await newUser("admin")
    const insert = (id: string, restaurantId: string, status = "pending") =>
      env.DB.prepare("insert into outbox_jobs (id, restaurant_id, order_id, payload, status) values (?, ?, ?, '{}', ?)")
        .bind(id, restaurantId, `ord-${id}`, status)
        .run()
    await insert("job_tenant_a", "rest_pizzaria")
    await insert("job_tenant_done", "rest_pizzaria", "done")
    await insert("job_other", "rest_burger")

    await suspend(admin.cookie, "rest_pizzaria")

    const status = async (id: string) =>
      env.DB.prepare("select status, last_error as reason from outbox_jobs where id = ?")
        .bind(id)
        .first<{ status: string; reason: string | null }>()
    expect(await status("job_tenant_a")).toEqual({ status: "dead", reason: "restaurante excluído" })
    expect((await status("job_tenant_done"))?.status).toBe("done")
    expect((await status("job_other"))?.status).toBe("pending")
  })
})

describe("restauração", () => {
  it("devolve o restaurante ao catálogo e a equipe à gestão, com os dados intactos", async () => {
    const admin = await newUser("admin")
    const staff = await newUser({ staffOf: "rest_pizzaria" })
    const created = await postJson(
      "/v1/manage/restaurants/rest_pizzaria/mkit/materials",
      { title: "Antes da exclusão", kind: "post", body: "texto" },
      { cookie: staff.cookie },
    )
    expect(created.status).toBe(201)

    await suspend(admin.cookie, "rest_pizzaria")
    expect(await restaurantSlugs()).not.toContain("pizzaria-da-praca")

    expect((await restore(admin.cookie, "rest_pizzaria")).status).toBe(200)
    expect(await restaurantSlugs()).toContain("pizzaria-da-praca")
    expect((await call("/v1/restaurants/pizzaria-da-praca/menu")).status).toBe(200)
    const list = await call("/v1/manage/restaurants/rest_pizzaria/mkit/materials", {
      headers: { cookie: staff.cookie },
    })
    expect(list.status).toBe(200)
    expect(JSON.stringify(await list.json())).toContain("Antes da exclusão")
    // Pode excluir de novo depois de restaurar.
    expect((await suspend(admin.cookie, "rest_pizzaria")).status).toBe(200)
  })
})

describe("remoção definitiva depois do prazo", () => {
  /** Restaurante descartável com cardápio, MKit e equipe, para a remoção não estragar os do seed. */
  async function createTenant() {
    const id = `tenant_${crypto.randomUUID().slice(0, 8)}`
    await env.DB.batch([
      env.DB.prepare("insert into restaurants (id, slug, name) values (?, ?, ?)").bind(
        id,
        id.replaceAll("_", "-"),
        "Descartável",
      ),
      env.DB.prepare("insert into menu_sections (id, restaurant_id, name) values (?, ?, 'Seção')").bind(
        `${id}_sec`,
        id,
      ),
      env.DB.prepare(
        "insert into products (id, restaurant_id, section_id, slug, name, price_cents) values (?, ?, ?, 'prod', 'Produto', 1000)",
      ).bind(`${id}_prod`, id, `${id}_sec`),
    ])
    const staff = await newUser({ staffOf: id })
    const base = `/v1/manage/restaurants/${id}/mkit`
    await postJson(`${base}/materials`, { title: "Material", kind: "post", body: "texto" }, { cookie: staff.cookie })
    await postJson(`${base}/categories`, { name: "Categoria própria" }, { cookie: staff.cookie })
    await postJson(`${base}/calendar`, { date: "2026-12-01", name: "Data própria" }, { cookie: staff.cookie })
    return id
  }
  const tenantRows = async (restaurantId: string) => ({
    sections: await count("select count(*) as n from menu_sections where restaurant_id = ?", restaurantId),
    products: await count("select count(*) as n from products where restaurant_id = ?", restaurantId),
    materials: await count("select count(*) as n from mkit_materials where restaurant_id = ?", restaurantId),
    categories: await count("select count(*) as n from mkit_categories where restaurant_id = ?", restaurantId),
    events: await count("select count(*) as n from mkit_calendar_events where restaurant_id = ?", restaurantId),
    members: await count("select count(*) as n from restaurant_members where restaurant_id = ?", restaurantId),
  })
  const FULL = { sections: 1, products: 1, materials: 1, categories: 1, events: 1, members: 1 }
  const EMPTY = { sections: 0, products: 0, materials: 0, categories: 0, events: 0, members: 0 }

  it("antes dos 30 dias nada é removido e ainda dá para restaurar", async () => {
    const admin = await newUser("admin")
    const id = await createTenant()
    await suspend(admin.cookie, id)
    await markDeleted(id, TENANT_GRACE_DAYS - 1)

    await purgeSuspendedTenants(env)
    expect(await tenantRows(id)).toEqual(FULL)
    expect((await restore(admin.cookie, id)).status).toBe(200)
  })

  it("depois dos 30 dias remove cardápio, MKit e equipe, deixa o marcador e não dá mais para restaurar", async () => {
    const admin = await newUser("admin")
    const id = await createTenant()
    expect(await tenantRows(id)).toEqual(FULL)
    await suspend(admin.cookie, id)
    await markDeleted(id, TENANT_GRACE_DAYS + 1)

    expect(await purgeSuspendedTenants(env)).toBeGreaterThanOrEqual(1)

    expect(await tenantRows(id)).toEqual(EMPTY)
    const marker = await env.DB.prepare("select purged_at, deleted_at from restaurants where id = ?").bind(id).first<{
      purged_at: string | null
      deleted_at: string | null
    }>()
    expect(marker?.purged_at).toBeTruthy()
    expect(marker?.deleted_at).toBeTruthy()

    const refused = await restore(admin.cookie, id)
    expect(refused.status).toBe(409)
    expect(JSON.stringify(await refused.json())).toContain("já foram removidos")
  })

  it("é repetível: rodar de novo não faz nada, e outros restaurantes não são tocados", async () => {
    const admin = await newUser("admin")
    const removed = await createTenant()
    const kept = await createTenant()
    await suspend(admin.cookie, removed)
    await markDeleted(removed, TENANT_GRACE_DAYS + 5)

    await purgeSuspendedTenants(env)
    expect(await purgeSuspendedTenants(env)).toBe(0)
    expect(await tenantRows(kept)).toEqual(FULL)
    expect(await tenantRows(removed)).toEqual(EMPTY)
  })

  it("limpa o histórico de eventos do objeto durável do restaurante", async () => {
    const admin = await newUser("admin")
    const id = await createTenant()
    const event = {
      type: "order.created",
      orderId: "ord-purge",
      status: "pending",
      at: "2026-01-01T00:00:00.000Z",
    } as never
    expect(await env.RESTAURANT_ROOM.getByName(id).publish(event)).not.toBeNull()
    // O mesmo evento de novo é descartado pela sala.
    expect(await env.RESTAURANT_ROOM.getByName(id).publish(event)).toBeNull()

    await suspend(admin.cookie, id)
    await markDeleted(id, TENANT_GRACE_DAYS + 1)
    await purgeSuspendedTenants(env)

    // Sem histórico, o mesmo evento volta a ser aceito como novo.
    expect(await env.RESTAURANT_ROOM.getByName(id).publish(event)).not.toBeNull()
  })

  it("os pedidos do restaurante removido ficam guardados e o cliente ainda os vê", async () => {
    const admin = await newUser("admin")
    const customer = await newUser()
    const order = await placeOrder(customer.cookie)
    await suspend(admin.cookie, "rest_burger")
    await markDeleted("rest_burger", TENANT_GRACE_DAYS + 1)

    await purgeSuspendedTenants(env)

    expect(await count("select count(*) as n from orders where id = ?", order.id)).toBe(1)
    expect(
      await count("select count(*) as n from restaurants where id = 'rest_burger' and purged_at is not null"),
    ).toBe(1)
    expect((await call(`/v1/orders/${order.id}`, { headers: { cookie: customer.cookie } })).status).toBe(200)
  })
})
