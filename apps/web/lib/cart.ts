import type { AddonGroup, CartItemInput } from "@delivery/contracts"

/** Um item da sacola. Os preços exibidos vêm sempre da cotação do servidor; aqui só há o que é preciso reenviar. */
export type CartLine = {
  /** Identificador local da linha (mesmo produto com adicionais diferentes são linhas diferentes). */
  key: string
  productId: string
  productName: string
  quantity: number
  addonOptionIds: string[]
  /** Nomes dos adicionais escolhidos, só para exibição. */
  addonLabels: string[]
  notes?: string
}

export type Cart = {
  restaurantId: string
  restaurantSlug: string
  restaurantName: string
  lines: CartLine[]
}

export const MAX_LINE_QUANTITY = 99

export function lineKey(productId: string, addonOptionIds: readonly string[], notes?: string): string {
  return [productId, [...addonOptionIds].sort().join("+"), notes ?? ""].join("|")
}

/**
 * Adiciona uma linha. A sacola é de um restaurante só: se o produto é de outro, a sacola anterior é descartada
 * (quem chama deve avisar o cliente antes). Linhas iguais somam a quantidade, respeitando o limite do produto.
 */
export function addLine(
  cart: Cart | null,
  restaurant: { id: string; slug: string; name: string },
  line: Omit<CartLine, "key">,
  maxQuantity = MAX_LINE_QUANTITY,
): Cart {
  const base: Cart =
    cart && cart.restaurantId === restaurant.id
      ? cart
      : { restaurantId: restaurant.id, restaurantSlug: restaurant.slug, restaurantName: restaurant.name, lines: [] }
  const key = lineKey(line.productId, line.addonOptionIds, line.notes)
  const existing = base.lines.find((candidate) => candidate.key === key)
  const limit = Math.min(maxQuantity, MAX_LINE_QUANTITY)
  if (existing) {
    return {
      ...base,
      lines: base.lines.map((candidate) =>
        candidate.key === key
          ? { ...candidate, quantity: Math.min(candidate.quantity + line.quantity, limit) }
          : candidate,
      ),
    }
  }
  return { ...base, lines: [...base.lines, { ...line, key, quantity: Math.min(line.quantity, limit) }] }
}

/** Define a quantidade de uma linha; zero (ou menos) remove a linha. Devolve null quando a sacola esvazia. */
export function setQuantity(cart: Cart, key: string, quantity: number): Cart | null {
  const lines =
    quantity <= 0
      ? cart.lines.filter((line) => line.key !== key)
      : cart.lines.map((line) =>
          line.key === key ? { ...line, quantity: Math.min(Math.floor(quantity), MAX_LINE_QUANTITY) } : line,
        )
  return lines.length === 0 ? null : { ...cart, lines }
}

export function itemCount(cart: Cart | null): number {
  return cart ? cart.lines.reduce((sum, line) => sum + line.quantity, 0) : 0
}

/** Itens no formato do contrato da cotação e do pedido. */
export function toItems(cart: Cart): CartItemInput[] {
  return cart.lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    addonOptionIds: line.addonOptionIds,
    ...(line.notes ? { notes: line.notes } : {}),
  }))
}

/** Regras de escolha de cada grupo, para validar no formulário antes de ir ao servidor (que valida de novo). */
export function validateSelection(
  groups: readonly AddonGroup[],
  selected: ReadonlySet<string>,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const group of groups) {
    const count = group.options.filter((option) => selected.has(option.id)).length
    if (count < group.minSelections) {
      errors[group.id] =
        group.minSelections === 1
          ? `Escolha uma opção em ${group.name}`
          : `Escolha ao menos ${group.minSelections} em ${group.name}`
    } else if (count > group.maxSelections) {
      errors[group.id] = `Escolha no máximo ${group.maxSelections} em ${group.name}`
    }
  }
  return errors
}

const STORAGE_KEY = "delivery-express:cart:v1"

export function loadCart(storage: Pick<Storage, "getItem">): Cart | null {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cart
    if (
      !parsed ||
      typeof parsed.restaurantId !== "string" ||
      !Array.isArray(parsed.lines) ||
      parsed.lines.length === 0
    ) {
      return null
    }
    return parsed
  } catch {
    // Armazenamento bloqueado ou conteúdo corrompido: sacola vazia, nunca erro na tela.
    return null
  }
}

export function saveCart(storage: Pick<Storage, "setItem" | "removeItem">, cart: Cart | null): void {
  try {
    if (cart) storage.setItem(STORAGE_KEY, JSON.stringify(cart))
    else storage.removeItem(STORAGE_KEY)
  } catch {
    // Sem armazenamento (modo privado, cota): a sacola vale só enquanto a página estiver aberta.
  }
}
