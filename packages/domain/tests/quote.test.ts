import { describe, expect, it } from "vitest"
import { type CatalogProduct, type CatalogRestaurant, type QuoteInput, quoteCart } from "../src/index.js"

const restaurant: CatalogRestaurant = {
  id: "rest_burger",
  isOpen: true,
  deliveryEnabled: true,
  pickupEnabled: true,
  deliveryFeeCents: 590,
  minimumOrderCents: 2000,
}

const burger: CatalogProduct = {
  id: "burger",
  name: "Burger clássico",
  priceCents: 3290,
  available: true,
  maxQuantity: 8,
  addonGroups: [
    {
      id: "ponto",
      name: "Ponto da carne",
      minSelections: 1,
      maxSelections: 1,
      options: [
        { id: "mal", name: "Mal passado", priceCents: 0, available: true },
        { id: "ao-ponto", name: "Ao ponto", priceCents: 0, available: true },
      ],
    },
    {
      id: "extras",
      name: "Adicionais",
      minSelections: 0,
      maxSelections: 2,
      options: [
        { id: "bacon", name: "Bacon", priceCents: 500, available: true },
        { id: "ovo", name: "Ovo", priceCents: 300, available: true },
        { id: "cheddar", name: "Cheddar", priceCents: 400, available: false },
      ],
    },
  ],
}

const soda: CatalogProduct = {
  id: "soda",
  name: "Refrigerante",
  priceCents: 650,
  available: true,
  maxQuantity: 12,
  addonGroups: [],
}

const quote = (input: Partial<QuoteInput>, overrides: Partial<CatalogRestaurant> = {}, products = [burger, soda]) =>
  quoteCart({ ...restaurant, ...overrides }, products, {
    fulfillment: "delivery",
    items: [{ productId: "burger", quantity: 1, addonOptionIds: ["ao-ponto"] }],
    ...input,
  })

const codes = (result: ReturnType<typeof quoteCart>) => (result.ok ? [] : result.issues.map((issue) => issue.code))

describe("quoteCart", () => {
  it("calcula linhas, adicionais por unidade, entrega e total em centavos", () => {
    const result = quote({
      items: [
        { productId: "burger", quantity: 2, addonOptionIds: ["mal", "bacon", "ovo"] },
        { productId: "soda", quantity: 3, addonOptionIds: [] },
      ],
    })
    expect(result).toEqual({
      ok: true,
      quote: {
        restaurantId: "rest_burger",
        lines: [
          {
            productId: "burger",
            name: "Burger clássico",
            quantity: 2,
            unitPriceCents: 3290,
            addonsCents: 800,
            lineTotalCents: 8180,
          },
          {
            productId: "soda",
            name: "Refrigerante",
            quantity: 3,
            unitPriceCents: 650,
            addonsCents: 0,
            lineTotalCents: 1950,
          },
        ],
        subtotalCents: 10130,
        deliveryCents: 590,
        discountCents: 0,
        totalCents: 10720,
      },
    })
  })

  it("não cobra entrega na retirada", () => {
    const result = quote({ fulfillment: "pickup" })
    expect(result.ok && result.quote).toMatchObject({ deliveryCents: 0, totalCents: 3290 })
  })

  it("rejeita restaurante fechado e modalidade desligada", () => {
    expect(codes(quote({}, { isOpen: false }))).toContain("restaurant_closed")
    expect(codes(quote({}, { deliveryEnabled: false }))).toContain("fulfillment_unavailable")
    expect(codes(quote({ fulfillment: "pickup" }, { pickupEnabled: false }))).toContain("fulfillment_unavailable")
  })

  it("rejeita produto inexistente ou indisponível", () => {
    expect(codes(quote({ items: [{ productId: "nao-existe", quantity: 1, addonOptionIds: [] }] }))).toEqual([
      "product_not_found",
    ])
    expect(codes(quote({}, {}, [{ ...burger, available: false }]))).toContain("product_unavailable")
  })

  it.each([0, -1, 9, 1.5])("rejeita quantidade %d", (quantity) => {
    expect(codes(quote({ items: [{ productId: "burger", quantity, addonOptionIds: ["mal"] }] }))).toContain(
      "quantity_out_of_range",
    )
  })

  it("rejeita adicional de outro produto, indisponível ou repetido", () => {
    expect(codes(quote({ items: [{ productId: "soda", quantity: 1, addonOptionIds: ["bacon"] }] }))).toContain(
      "option_not_found",
    )
    expect(
      codes(quote({ items: [{ productId: "burger", quantity: 1, addonOptionIds: ["mal", "cheddar"] }] })),
    ).toContain("option_unavailable")
    expect(
      codes(quote({ items: [{ productId: "burger", quantity: 1, addonOptionIds: ["mal", "bacon", "bacon"] }] })),
    ).toContain("option_duplicated")
  })

  it("exige o mínimo e respeita o máximo de cada grupo", () => {
    const missingRequired = quote({ items: [{ productId: "burger", quantity: 1, addonOptionIds: [] }] })
    expect(missingRequired).toEqual({
      ok: false,
      issues: [
        { code: "selection_out_of_range", path: "items.0.addonOptionIds", message: "Ponto da carne: escolha 1" },
      ],
    })
    const twoPoints = quote({ items: [{ productId: "burger", quantity: 1, addonOptionIds: ["mal", "ao-ponto"] }] })
    expect(codes(twoPoints)).toEqual(["selection_out_of_range"])
    const tooManyExtras = quote({
      items: [{ productId: "burger", quantity: 1, addonOptionIds: ["mal", "bacon", "ovo", "cheddar"] }],
    })
    expect(tooManyExtras.ok).toBe(false)
    if (!tooManyExtras.ok) {
      expect(tooManyExtras.issues).toContainEqual({
        code: "selection_out_of_range",
        path: "items.0.addonOptionIds",
        message: "Adicionais: escolha de 0 a 2",
      })
    }
  })

  it("exige o pedido mínimo sobre o subtotal, sem contar a entrega", () => {
    const result = quote({ items: [{ productId: "soda", quantity: 3, addonOptionIds: [] }] })
    expect(codes(result)).toEqual(["minimum_not_reached"])
  })

  it("rejeita cupom enquanto não há cupons cadastrados", () => {
    expect(codes(quote({ couponCode: "DESCONTO10" }))).toEqual(["coupon_invalid"])
  })

  it("acumula todos os problemas em vez de parar no primeiro", () => {
    const result = quote(
      { items: [{ productId: "burger", quantity: 99, addonOptionIds: ["x"] }], couponCode: "X" },
      { isOpen: false },
    )
    expect(codes(result)).toEqual([
      "restaurant_closed",
      "coupon_invalid",
      "quantity_out_of_range",
      "option_not_found",
      "selection_out_of_range",
    ])
  })
})
