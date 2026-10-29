export type OrderLine = {
  unitPriceCents: number;
  quantity: number;
};

export type OrderTotals = {
  subtotalCents: number;
  deliveryCents: number;
  discountCents: number;
  totalCents: number;
};

export function calculateOrderTotals(
  lines: readonly OrderLine[],
  deliveryCents: number,
  discountCents = 0,
): OrderTotals {
  if (!Number.isInteger(deliveryCents) || deliveryCents < 0) {
    throw new RangeError("deliveryCents must be a non-negative integer");
  }
  if (!Number.isInteger(discountCents) || discountCents < 0) {
    throw new RangeError("discountCents must be a non-negative integer");
  }
  const subtotalCents = lines.reduce((sum, line) => {
    if (!Number.isInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
      throw new RangeError("unitPriceCents must be a non-negative integer");
    }
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new RangeError("quantity must be a positive integer");
    }
    return sum + line.unitPriceCents * line.quantity;
  }, 0);
  const appliedDiscountCents = Math.min(discountCents, subtotalCents);
  return {
    subtotalCents,
    deliveryCents,
    discountCents: appliedDiscountCents,
    totalCents: subtotalCents - appliedDiscountCents + deliveryCents,
  };
}
