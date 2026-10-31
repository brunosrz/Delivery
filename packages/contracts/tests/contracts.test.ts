import { describe, expect, it } from "vitest"
import { z } from "zod"
import {
  AddonGroup,
  Cents,
  CreateOrderRequest,
  IdempotencyKey,
  Menu,
  OrderStatus,
  QuoteRequest,
  SessionUser,
  Slug,
  StatusTransitionRequest,
  envelope,
} from "../src/index.js"

const restaurant = {
  id: "rest_1",
  slug: "pizzaria-centro",
  name: "Pizzaria Centro",
  description: null,
  logoUrl: null,
  coverUrl: "https://cdn.example.test/capa.png",
  timezone: "America/Sao_Paulo",
  isOpen: true,
  deliveryEnabled: true,
  pickupEnabled: true,
  deliveryFeeCents: 790,
  minimumOrderCents: 2000,
  openingHours: [{ weekday: 5, opensAt: 1080, closesAt: 1380 }],
}

const product = {
  id: "prod_1",
  restaurantId: "rest_1",
  slug: "pizza-calabresa",
  name: "Pizza calabresa",
  description: "Molho, mussarela e calabresa",
  imageUrl: null,
  priceCents: 4590,
  originalPriceCents: null,
  available: true,
  maxQuantity: 10,
  addonGroups: [
    {
      id: "grp_1",
      name: "Borda",
      minSelections: 0,
      maxSelections: 1,
      options: [{ id: "opt_1", name: "Catupiry", priceCents: 800, available: true }],
    },
  ],
}

const address = {
  street: "Rua das Flores",
  number: "120",
  district: "Centro",
  city: "São João Batista do Glória",
  state: "MG",
  postalCode: "37920-000",
}

describe("Cents", () => {
  it.each([0, 1, 4590, Number.MAX_SAFE_INTEGER])("aceita %d", (value) => {
    expect(Cents.parse(value)).toBe(value)
  })

  it.each([-1, 45.9, Number.MAX_SAFE_INTEGER + 1, Number.NaN])("rejeita %d", (value) => {
    expect(Cents.safeParse(value).success).toBe(false)
  })
})

describe("identificadores", () => {
  it("valida slugs de URL", () => {
    expect(Slug.safeParse("pizza-calabresa").success).toBe(true)
    expect(Slug.safeParse("Pizza Calabresa").success).toBe(false)
    expect(Slug.safeParse("-pizza").success).toBe(false)
  })

  it("exige idempotency keys longas e sem espaços", () => {
    expect(IdempotencyKey.safeParse("01JC8X3ZJ4Q0W8S6Y7T9V2B1N5").success).toBe(true)
    expect(IdempotencyKey.safeParse("curta").success).toBe(false)
    expect(IdempotencyKey.safeParse("tem espaço e tem mais de dezesseis").success).toBe(false)
  })
})

describe("catálogo", () => {
  it("aceita um cardápio completo", () => {
    expect(
      Menu.parse({ restaurant, sections: [{ id: "sec_1", name: "Pizzas", position: 0, products: [product] }] }),
    ).toBeTruthy()
  })

  it("rejeita grupo de adicionais com mínimo maior que o máximo", () => {
    const result = AddonGroup.safeParse({ ...product.addonGroups[0], minSelections: 2, maxSelections: 1 })
    expect(result.success).toBe(false)
  })

  it("rejeita preço em reais com casas decimais", () => {
    const result = Menu.safeParse({
      restaurant,
      sections: [{ id: "sec_1", name: "Pizzas", position: 0, products: [{ ...product, priceCents: 45.9 }] }],
    })
    expect(result.success).toBe(false)
  })
})

describe("cotação e pedido", () => {
  const item = { productId: "prod_1", quantity: 2, addonOptionIds: ["opt_1"] }

  it("aceita cotação sem preços enviados pelo cliente", () => {
    expect(QuoteRequest.parse({ restaurantId: "rest_1", fulfillment: "pickup", items: [item] }).items).toHaveLength(1)
  })

  it("rejeita preço ou total enviado na cotação", () => {
    expect(
      QuoteRequest.safeParse({ restaurantId: "rest_1", fulfillment: "pickup", items: [item], totalCents: 1 }).success,
    ).toBe(false)
  })

  it.each([0, 100, 1.5])("rejeita quantidade %d", (quantity) => {
    expect(
      QuoteRequest.safeParse({ restaurantId: "rest_1", fulfillment: "pickup", items: [{ ...item, quantity }] }).success,
    ).toBe(false)
  })

  it("exige endereço para entrega", () => {
    const base = {
      restaurantId: "rest_1",
      fulfillment: "delivery",
      items: [item],
      paymentMethod: "pix_on_delivery",
      expectedTotalCents: 10770,
    }
    expect(CreateOrderRequest.safeParse(base).success).toBe(false)
    expect(CreateOrderRequest.safeParse({ ...base, address }).success).toBe(true)
  })

  it("aceita retirada sem endereço", () => {
    expect(
      CreateOrderRequest.safeParse({
        restaurantId: "rest_1",
        fulfillment: "pickup",
        items: [item],
        paymentMethod: "cash",
        expectedTotalCents: 9180,
      }).success,
    ).toBe(true)
  })

  it("rejeita status desconhecido na transição", () => {
    expect(StatusTransitionRequest.safeParse({ to: "shipped" }).success).toBe(false)
    expect(OrderStatus.options).toContain("dispatched")
  })
})

describe("identidade", () => {
  it("rejeita papel desconhecido", () => {
    const user = { id: "usr_1", email: "cliente@example.test", name: "Cliente", role: "customer", restaurantIds: [] }
    expect(SessionUser.safeParse(user).success).toBe(true)
    expect(SessionUser.safeParse({ ...user, role: "root" }).success).toBe(false)
  })
})

describe("envelope", () => {
  const Response = envelope(z.object({ ok: z.boolean() }))
  const meta = { requestId: "req_1", apiVersion: "v1" }

  it("aceita sucesso ou erro, nunca os dois", () => {
    expect(Response.safeParse({ data: { ok: true }, error: null, meta }).success).toBe(true)
    expect(
      Response.safeParse({ data: null, error: { code: "not_found", message: "não encontrado" }, meta }).success,
    ).toBe(true)
    expect(
      Response.safeParse({ data: { ok: true }, error: { code: "internal", message: "falhou" }, meta }).success,
    ).toBe(false)
  })

  it("rejeita código de erro fora do catálogo e versão errada", () => {
    expect(Response.safeParse({ data: null, error: { code: "oops", message: "x" }, meta }).success).toBe(false)
    expect(Response.safeParse({ data: { ok: true }, error: null, meta: { ...meta, apiVersion: "v2" } }).success).toBe(
      false,
    )
  })
})
