import { describe, expect, it } from "vitest";
import { calculateOrderTotals } from "@/lib/order-totals";

describe("calculateOrderTotals", () => {
  it("calculates subtotal, delivery and discount in integer cents", () => {
    expect(
      calculateOrderTotals([{ unitPriceCents: 2500, quantity: 2 }], 1090, 500),
    ).toEqual({
      subtotalCents: 5000,
      deliveryCents: 1090,
      discountCents: 500,
      totalCents: 5590,
    });
  });

  it("caps a discount at the subtotal instead of producing a negative order", () => {
    expect(
      calculateOrderTotals([{ unitPriceCents: 1000, quantity: 1 }], 0, 5000)
        .totalCents,
    ).toBe(0);
  });

  it.each([
    [{ unitPriceCents: -1, quantity: 1 }],
    [{ unitPriceCents: 100, quantity: 0 }],
    [{ unitPriceCents: 100.5, quantity: 1 }],
  ])("rejects invalid order lines: %o", (line) => {
    expect(() => calculateOrderTotals([line], 0)).toThrow(RangeError);
  });

  it("rejects negative delivery and discount values", () => {
    expect(() => calculateOrderTotals([], -1)).toThrow(RangeError);
    expect(() => calculateOrderTotals([], 0, -1)).toThrow(RangeError);
  });
});
