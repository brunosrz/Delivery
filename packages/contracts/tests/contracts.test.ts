import { describe, expect, it } from "vitest"
import { z } from "zod"
import {
  AddonGroup,
  Cents,
  CreateMkitMaterial,
  CreateOrderRequest,
  IdempotencyKey,
  Menu,
  Order,
  OrderStatus,
  QuoteRequest,
  SessionUser,
  Slug,
  StatusTransitionRequest,
  UpdateMkitMaterial,
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

  it("rejeita preço injetado dentro de um item e campo extra no endereço", () => {
    const base = { restaurantId: "rest_1", fulfillment: "pickup", items: [item] }
    expect(QuoteRequest.safeParse({ ...base, items: [{ ...item, priceCents: 1 }] }).success).toBe(false)
    expect(
      CreateOrderRequest.safeParse({
        ...base,
        fulfillment: "delivery",
        paymentMethod: "cash",
        expectedTotalCents: 100,
        address: { ...address, country: "BR" },
      }).success,
    ).toBe(false)
  })

  describe("Order", () => {
    const order = {
      id: "ord_1",
      restaurantId: "rest_1",
      customerId: "usr_1",
      fulfillment: "delivery",
      status: "pending",
      payment: { method: "cash", status: "pending" },
      quote: {
        restaurantId: "rest_1",
        lines: [
          {
            productId: "prod_1",
            name: "Pizza",
            quantity: 1,
            unitPriceCents: 4000,
            addonsCents: 0,
            lineTotalCents: 4000,
          },
        ],
        subtotalCents: 4000,
        deliveryCents: 500,
        discountCents: 0,
        totalCents: 4500,
      },
      address,
      timeline: [{ status: "pending", at: "2026-10-31T12:00:00Z", actorRole: "customer" }],
      createdAt: "2026-10-31T12:00:00Z",
      updatedAt: "2026-10-31T12:00:00Z",
    }

    it("exige endereço em pedido de entrega", () => {
      expect(Order.safeParse(order).success).toBe(true)
      expect(Order.safeParse({ ...order, address: null }).success).toBe(false)
    })

    it("aceita retirada sem endereço", () => {
      expect(Order.safeParse({ ...order, fulfillment: "pickup", address: null }).success).toBe(true)
    })
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

describe("grupos de complementos inviáveis", () => {
  const option = { id: "opt_1", name: "Borda", priceCents: 500, available: true }
  const group = { id: "grp_1", name: "Extras", minSelections: 2, maxSelections: 2, options: [option] }

  it("rejeita mínimo maior que o número de opções", () => {
    expect(AddonGroup.safeParse(group).success).toBe(false)
  })

  it("aceita mínimo igual ao número de opções", () => {
    expect(
      AddonGroup.safeParse({ ...group, options: [option, { ...option, id: "opt_2", name: "Cheddar" }] }).success,
    ).toBe(true)
  })
})

describe("materiais do MKit", () => {
  it("limpa HTML do título e do corpo na entrada", () => {
    const parsed = CreateMkitMaterial.parse({
      title: "Promo <b>2 por 1</b>",
      kind: "post",
      body: "Venha!<script>alert(1)</script> Hoje.",
    })
    expect(parsed).toEqual({ title: "Promo 2 por 1", kind: "post", body: "Venha! Hoje." })
  })

  it("recusa conteúdo vazio depois da limpeza, tipo desconhecido e campos extras", () => {
    expect(CreateMkitMaterial.safeParse({ title: "Ok", kind: "post", body: "<script>x</script>" }).success).toBe(false)
    expect(CreateMkitMaterial.safeParse({ title: "Ok", kind: "banner", body: "texto" }).success).toBe(false)
    expect(CreateMkitMaterial.safeParse({ title: "Ok", kind: "post", body: "x", restaurantId: "r" }).success).toBe(
      false,
    )
  })

  it("a atualização exige ao menos um campo", () => {
    expect(UpdateMkitMaterial.safeParse({}).success).toBe(false)
    expect(UpdateMkitMaterial.safeParse({ status: "published" }).success).toBe(true)
  })
})
