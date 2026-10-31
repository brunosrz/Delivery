export type OrderLine = {
  unitPriceCents: number
  quantity: number
}

export type OrderTotals = {
  subtotalCents: number
  deliveryCents: number
  discountCents: number
  totalCents: number
}

function assertSafeCents(value: number, name: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} exceeds the safe integer range`)
  }
  return value
}

/**
 * Calcula os totais de um pedido em centavos inteiros.
 *
 * O desconto é limitado ao subtotal e a taxa de entrega é sempre cobrada.
 * Lança `RangeError` para entradas inválidas ou resultados fora do intervalo
 * de inteiros seguros, em vez de devolver um valor sem precisão.
 */
export function calculateOrderTotals(
  lines: readonly OrderLine[],
  deliveryCents: number,
  discountCents = 0,
): OrderTotals {
  if (!Number.isSafeInteger(deliveryCents) || deliveryCents < 0) {
    throw new RangeError("deliveryCents must be a non-negative integer")
  }
  if (!Number.isSafeInteger(discountCents) || discountCents < 0) {
    throw new RangeError("discountCents must be a non-negative integer")
  }
  const subtotalCents = lines.reduce((sum, line) => {
    if (!Number.isSafeInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
      throw new RangeError("unitPriceCents must be a non-negative integer")
    }
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
      throw new RangeError("quantity must be a positive integer")
    }
    const lineCents = assertSafeCents(line.unitPriceCents * line.quantity, "line total")
    return assertSafeCents(sum + lineCents, "subtotalCents")
  }, 0)
  const appliedDiscountCents = Math.min(discountCents, subtotalCents)
  return {
    subtotalCents,
    deliveryCents,
    discountCents: appliedDiscountCents,
    totalCents: assertSafeCents(subtotalCents - appliedDiscountCents + deliveryCents, "totalCents"),
  }
}
