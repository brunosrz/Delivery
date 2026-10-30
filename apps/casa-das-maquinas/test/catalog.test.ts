import { Menu, Restaurant, envelope } from "@delivery/contracts"
import { env, exports } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { z } from "zod"

const call = (path: string, init?: RequestInit) => exports.default.fetch(new Request(`https://api.test${path}`, init))

describe("GET /v1/health", () => {
  it("responde ok com o banco acessível e devolve o request id", async () => {
    const response = await call("/v1/health", { headers: { "x-request-id": "req-health-0001" } })
    expect(response.status).toBe(200)
    expect(response.headers.get("x-request-id")).toBe("req-health-0001")
    expect(await response.json()).toEqual({
      data: { status: "ok" },
      error: null,
      meta: { requestId: "req-health-0001", apiVersion: "v1" },
    })
  })

  it("gera um request id quando o recebido é inválido", async () => {
    const response = await call("/v1/health", { headers: { "x-request-id": "curto" } })
    expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/)
  })
})

describe("GET /v1/restaurants", () => {
  it("lista restaurantes no contrato v1, por prioridade", async () => {
    const response = await call("/v1/restaurants")
    expect(response.status).toBe(200)
    const body = envelope(z.array(Restaurant)).parse(await response.json())
    expect(body.data?.map((restaurant) => restaurant.slug)).toEqual(["pizzaria-da-praca", "burger-do-bairro"])
    expect(body.data?.[0]?.deliveryFeeCents).toBe(790)
    expect(body.data?.[0]?.openingHours).toHaveLength(2)
  })
})

describe("GET /v1/restaurants/:slug/menu", () => {
  it("devolve o cardápio completo com preços em centavos", async () => {
    const response = await call("/v1/restaurants/burger-do-bairro/menu")
    expect(response.status).toBe(200)
    const { data } = envelope(Menu).parse(await response.json())
    const burger = data?.sections[0]?.products[0]
    expect(burger?.priceCents).toBe(3290)
    expect(burger?.addonGroups.map((group) => [group.name, group.minSelections, group.options.length])).toEqual([
      ["Ponto da carne", 1, 2],
      ["Adicionais", 0, 2],
    ])
  })

  it("não mistura dados de outro restaurante", async () => {
    const response = await call("/v1/restaurants/pizzaria-da-praca/menu")
    const { data } = envelope(Menu).parse(await response.json())
    const restaurantIds = new Set(data?.sections.flatMap((section) => section.products.map((p) => p.restaurantId)))
    expect([...restaurantIds]).toEqual(["rest_pizzaria"])
    expect(JSON.stringify(data)).not.toContain("rest_burger")
  })

  it("ignora grupos de adicionais sem opções", async () => {
    await env.DB.prepare(
      "insert into addon_groups (id, restaurant_id, product_id, name, min_selections, max_selections) values ('grp_vazio', 'rest_pizzaria', 'prod_pz_carne', 'Vazio', 0, 1)",
    ).run()
    const response = await call("/v1/restaurants/pizzaria-da-praca/menu")
    const { data } = envelope(Menu).parse(await response.json())
    const carne = data?.sections[0]?.products.find((product) => product.id === "prod_pz_carne")
    expect(carne?.addonGroups).toEqual([])
  })

  it("responde 404 no envelope para restaurante inexistente", async () => {
    const response = await call("/v1/restaurants/nao-existe/menu")
    expect(response.status).toBe(404)
    const body = (await response.json()) as { data: unknown; error: { code: string } }
    expect(body.data).toBeNull()
    expect(body.error.code).toBe("not_found")
  })

  it("rejeita slug inválido com 400 e campos", async () => {
    const response = await call("/v1/restaurants/Slug%20Invalido/menu")
    expect(response.status).toBe(400)
    const body = (await response.json()) as { error: { code: string; fields: Record<string, string[]> } }
    expect(body.error.code).toBe("bad_request")
    expect(Object.keys(body.error.fields)).toContain("slug")
  })
})

describe("restrições do banco", () => {
  it("rejeita preço negativo e slug duplicado no mesmo restaurante", async () => {
    await expect(
      env.DB.prepare(
        "insert into products (id, restaurant_id, section_id, slug, name, price_cents) values ('p_neg', 'rest_burger', 'sec_bg_burgers', 'negativo', 'X', -1)",
      ).run(),
    ).rejects.toThrow(/CHECK constraint failed/)
    await expect(
      env.DB.prepare(
        "insert into products (id, restaurant_id, section_id, slug, name, price_cents) values ('p_dup', 'rest_burger', 'sec_bg_burgers', 'burger-classico', 'X', 100)",
      ).run(),
    ).rejects.toThrow(/UNIQUE constraint failed/)
  })
})

describe("rotas gerais", () => {
  it("publica a OpenAPI 3.1 com as rotas v1", async () => {
    const response = await call("/v1/openapi.json")
    const doc = (await response.json()) as { openapi: string; paths: Record<string, unknown> }
    expect(doc.openapi).toBe("3.1.0")
    expect(Object.keys(doc.paths)).toEqual(
      expect.arrayContaining(["/v1/health", "/v1/restaurants", "/v1/restaurants/{slug}/menu"]),
    )
  })

  it("responde 404 no envelope para rota desconhecida", async () => {
    const response = await call("/v2/qualquer")
    expect(response.status).toBe(404)
    expect(((await response.json()) as { error: { code: string } }).error.code).toBe("not_found")
  })
})
