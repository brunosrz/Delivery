import { calculateOrderTotals } from "./order-totals.js"

// Cotação pura: recebe um retrato do catálogo e o pedido do cliente, e devolve
// o preço calculado ou todos os problemas encontrados. Não confia em nenhum
// preço vindo do cliente. É a referência para o serviço Rust da issue #15.

export type CatalogOption = { id: string; name: string; priceCents: number; available: boolean }

export type CatalogAddonGroup = {
  id: string
  name: string
  minSelections: number
  maxSelections: number
  options: CatalogOption[]
}

export type CatalogProduct = {
  id: string
  name: string
  priceCents: number
  available: boolean
  maxQuantity: number
  addonGroups: CatalogAddonGroup[]
}

export type CatalogRestaurant = {
  id: string
  isOpen: boolean
  deliveryEnabled: boolean
  pickupEnabled: boolean
  deliveryFeeCents: number
  minimumOrderCents: number
}

export type QuoteInput = {
  fulfillment: "delivery" | "pickup"
  items: { productId: string; quantity: number; addonOptionIds: string[] }[]
  couponCode?: string | undefined
}

export type QuoteIssueCode =
  | "restaurant_closed"
  | "fulfillment_unavailable"
  | "product_not_found"
  | "product_unavailable"
  | "quantity_out_of_range"
  | "option_not_found"
  | "option_unavailable"
  | "option_duplicated"
  | "selection_out_of_range"
  | "minimum_not_reached"
  | "coupon_invalid"

export type QuoteIssue = { code: QuoteIssueCode; path: string; message: string }

export type QuoteLine = {
  productId: string
  name: string
  quantity: number
  unitPriceCents: number
  addonsCents: number
  lineTotalCents: number
}

export type QuoteResult =
  | {
      ok: true
      quote: {
        restaurantId: string
        lines: QuoteLine[]
        subtotalCents: number
        deliveryCents: number
        discountCents: number
        totalCents: number
      }
    }
  | { ok: false; issues: QuoteIssue[] }

export function quoteCart(
  restaurant: CatalogRestaurant,
  products: readonly CatalogProduct[],
  input: QuoteInput,
): QuoteResult {
  const issues: QuoteIssue[] = []
  const byId = new Map(products.map((product) => [product.id, product]))

  if (!restaurant.isOpen)
    issues.push({ code: "restaurant_closed", path: "restaurantId", message: "restaurante fechado" })
  const fulfillmentEnabled = input.fulfillment === "delivery" ? restaurant.deliveryEnabled : restaurant.pickupEnabled
  if (!fulfillmentEnabled) {
    issues.push({ code: "fulfillment_unavailable", path: "fulfillment", message: "modalidade indisponível" })
  }
  // Não há cupons cadastrados: qualquer código é rejeitado em vez de ignorado em silêncio.
  if (input.couponCode) issues.push({ code: "coupon_invalid", path: "couponCode", message: "cupom inválido" })

  const lines: QuoteLine[] = []
  input.items.forEach((item, index) => {
    const path = `items.${index}`
    const product = byId.get(item.productId)
    if (!product) {
      issues.push({ code: "product_not_found", path: `${path}.productId`, message: "produto não encontrado" })
      return
    }
    if (!product.available) {
      issues.push({ code: "product_unavailable", path: `${path}.productId`, message: `${product.name} indisponível` })
    }
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > product.maxQuantity) {
      issues.push({
        code: "quantity_out_of_range",
        path: `${path}.quantity`,
        message: `quantidade deve ficar entre 1 e ${product.maxQuantity}`,
      })
    }

    const optionGroup = new Map<string, { group: CatalogAddonGroup; option: CatalogOption }>()
    for (const group of product.addonGroups) {
      for (const option of group.options) optionGroup.set(option.id, { group, option })
    }

    const seen = new Set<string>()
    const selectedPerGroup = new Map<string, number>()
    let addonsCents = 0
    item.addonOptionIds.forEach((optionId, optionIndex) => {
      const optionPath = `${path}.addonOptionIds.${optionIndex}`
      if (seen.has(optionId)) {
        issues.push({ code: "option_duplicated", path: optionPath, message: "adicional repetido" })
        return
      }
      seen.add(optionId)
      const found = optionGroup.get(optionId)
      if (!found) {
        issues.push({ code: "option_not_found", path: optionPath, message: "adicional não pertence ao produto" })
        return
      }
      if (!found.option.available) {
        issues.push({ code: "option_unavailable", path: optionPath, message: `${found.option.name} indisponível` })
      }
      selectedPerGroup.set(found.group.id, (selectedPerGroup.get(found.group.id) ?? 0) + 1)
      addonsCents += found.option.priceCents
    })

    for (const group of product.addonGroups) {
      const count = selectedPerGroup.get(group.id) ?? 0
      if (count < group.minSelections || count > group.maxSelections) {
        issues.push({
          code: "selection_out_of_range",
          path: `${path}.addonOptionIds`,
          message:
            group.minSelections === group.maxSelections
              ? `${group.name}: escolha ${group.minSelections}`
              : `${group.name}: escolha de ${group.minSelections} a ${group.maxSelections}`,
        })
      }
    }

    lines.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPriceCents: product.priceCents,
      addonsCents,
      lineTotalCents: 0,
    })
  })

  if (issues.length > 0) return { ok: false, issues }

  const deliveryCents = input.fulfillment === "delivery" ? restaurant.deliveryFeeCents : 0
  const totals = calculateOrderTotals(
    lines.map((line) => ({ unitPriceCents: line.unitPriceCents + line.addonsCents, quantity: line.quantity })),
    deliveryCents,
  )
  if (totals.subtotalCents < restaurant.minimumOrderCents) {
    return {
      ok: false,
      issues: [{ code: "minimum_not_reached", path: "items", message: "pedido abaixo do valor mínimo do restaurante" }],
    }
  }

  return {
    ok: true,
    quote: {
      restaurantId: restaurant.id,
      lines: lines.map((line) => ({
        ...line,
        lineTotalCents: (line.unitPriceCents + line.addonsCents) * line.quantity,
      })),
      ...totals,
    },
  }
}
