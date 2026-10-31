import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { z } from "zod"

// O snapshot em openapi/v1.json é o que a Casa das Máquinas publica em /v1/openapi.json. Estes testes validam as
// respostas que o cliente espera contra o JSON Schema desse documento, sem usar os schemas Zod do pacote:
// se o servidor mudar um tipo ou um caminho e o snapshot for regenerado, o teste acusa a incompatibilidade.
// Refinamentos do Zod (ex.: endereço obrigatório na entrega) não existem no OpenAPI e seguem cobertos por contracts.test.ts.

type Doc = {
  paths: Record<string, Record<string, { responses: Record<string, { content?: Record<string, { schema: object }> }> }>>
}

const snapshot = JSON.parse(readFileSync(new URL("../openapi/v1.json", import.meta.url), "utf8")) as Doc
const clone = (): Doc => JSON.parse(JSON.stringify(snapshot)) as Doc

/** Rotas que o cliente tipado chama (src/client.ts). */
const CLIENT_ROUTES: [method: string, path: string][] = [
  ["get", "/v1/restaurants"],
  ["get", "/v1/restaurants/{slug}/menu"],
  ["post", "/v1/quotes"],
  ["post", "/v1/orders"],
  ["get", "/v1/orders/{orderId}"],
]

function responseSchema(doc: Doc, method: string, path: string, status: string) {
  const schema = doc.paths[path]?.[method]?.responses[status]?.content?.["application/json"]?.schema
  if (!schema) throw new Error(`sem schema ${method.toUpperCase()} ${path} ${status}`)
  return z.fromJSONSchema(schema as Parameters<typeof z.fromJSONSchema>[0])
}

const meta = { requestId: "req_123456789", apiVersion: "v1" }
const restaurant = {
  id: "rest_1",
  slug: "pizzaria",
  name: "Pizzaria",
  description: null,
  logoUrl: null,
  coverUrl: null,
  timezone: "America/Sao_Paulo",
  isOpen: true,
  deliveryEnabled: true,
  pickupEnabled: true,
  deliveryFeeCents: 500,
  minimumOrderCents: 0,
  openingHours: [],
}
const quote = {
  restaurantId: "rest_1",
  lines: [{ productId: "p1", name: "Pizza", quantity: 1, unitPriceCents: 4000, addonsCents: 0, lineTotalCents: 4000 }],
  subtotalCents: 4000,
  deliveryCents: 0,
  discountCents: 0,
  totalCents: 4000,
}
const order = {
  id: "ord_1",
  restaurantId: "rest_1",
  customerId: "usr_1",
  fulfillment: "pickup",
  status: "pending",
  payment: { method: "cash", status: "pending" },
  quote,
  address: null,
  timeline: [{ status: "pending", at: "2026-10-31T12:00:00Z", actorRole: "customer" }],
  createdAt: "2026-10-31T12:00:00Z",
  updatedAt: "2026-10-31T12:00:00Z",
}
const ok = (data: unknown) => ({ data, error: null, meta })

describe("cliente x OpenAPI publicado", () => {
  it.each(CLIENT_ROUTES)("o snapshot tem %s %s", (method, path) => {
    expect(snapshot.paths[path]?.[method]).toBeDefined()
  })

  it("aceita as respostas de sucesso e de erro que o cliente consome", () => {
    expect(responseSchema(snapshot, "get", "/v1/restaurants", "200").safeParse(ok([restaurant])).success).toBe(true)
    expect(responseSchema(snapshot, "post", "/v1/quotes", "200").safeParse(ok(quote)).success).toBe(true)
    expect(responseSchema(snapshot, "get", "/v1/orders/{orderId}", "200").safeParse(ok(order)).success).toBe(true)
    expect(responseSchema(snapshot, "post", "/v1/orders", "201").safeParse(ok(order)).success).toBe(true)

    const error = { data: null, error: { code: "not_found", message: "pedido não encontrado" }, meta }
    expect(responseSchema(snapshot, "get", "/v1/orders/{orderId}", "404").safeParse(error).success).toBe(true)
  })

  it("rejeita uma resposta que quebra o contrato", () => {
    const schema = responseSchema(snapshot, "get", "/v1/restaurants", "200")
    expect(schema.safeParse(ok([{ ...restaurant, deliveryFeeCents: "5,00" }])).success).toBe(false)
    expect(schema.safeParse(ok([{ ...restaurant, deliveryFeeCents: 5.5 }])).success).toBe(false)
  })
})

describe("incompatibilidade deliberada em uma cópia do snapshot", () => {
  it("detecta deliveryFeeCents publicado como string", () => {
    const broken = clone()
    const item = (
      broken.paths["/v1/restaurants"]?.get?.responses["200"]?.content?.["application/json"]?.schema as {
        anyOf: { properties: { data: { items: { properties: Record<string, object> } } } }[]
      }
    ).anyOf[0]?.properties.data.items.properties
    if (!item) throw new Error("estrutura inesperada do snapshot")
    item.deliveryFeeCents = { type: "string" }

    // O cliente continua enviando um número: com o snapshot quebrado a resposta válida deixa de passar.
    const schema = responseSchema(broken, "get", "/v1/restaurants", "200")
    expect(schema.safeParse(ok([restaurant])).success).toBe(false)
  })

  it("detecta um caminho renomeado", () => {
    const broken = clone()
    broken.paths["/v1/pedidos"] = broken.paths["/v1/orders"] ?? {}
    delete broken.paths["/v1/orders"]
    const missing = CLIENT_ROUTES.filter(([method, path]) => !broken.paths[path]?.[method])
    expect(missing).toEqual([["post", "/v1/orders"]])
  })
})
