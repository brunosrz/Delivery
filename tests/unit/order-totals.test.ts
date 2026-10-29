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

  it("caps a discount at the subtotal and still charges delivery", () => {
    expect(
      calculateOrderTotals([{ unitPriceCents: 1000, quantity: 1 }], 700, 5000),
    ).toEqual({
      subtotalCents: 1000,
      deliveryCents: 700,
      discountCents: 1000,
      totalCents: 700,
    });
  });

  it.each([
    [[{ unitPriceCents: Number.MAX_SAFE_INTEGER, quantity: 2 }], 0],
    [
      [
        { unitPriceCents: Number.MAX_SAFE_INTEGER, quantity: 1 },
        { unitPriceCents: 1, quantity: 1 },
      ],
      0,
    ],
    [[{ unitPriceCents: Number.MAX_SAFE_INTEGER, quantity: 1 }], 2],
  ])(
    "rejects totals outside the safe integer range: %o + %i",
    (lines, delivery) => {
      expect(() => calculateOrderTotals(lines, delivery)).toThrow(RangeError);
    },
  );

  it("accepts the largest safe quantity when the line total stays safe", () => {
    expect(
      calculateOrderTotals(
        [{ unitPriceCents: 0, quantity: Number.MAX_SAFE_INTEGER }],
        0,
      ),
    ).toEqual({
      subtotalCents: 0,
      deliveryCents: 0,
      discountCents: 0,
      totalCents: 0,
    });
  });

  it("rejects unsafe delivery and discount values", () => {
    expect(() => calculateOrderTotals([], Number.MAX_SAFE_INTEGER + 1)).toThrow(
      RangeError,
    );
    expect(() =>
      calculateOrderTotals([], 0, Number.MAX_SAFE_INTEGER + 1),
    ).toThrow(RangeError);
  });

  it.each([
    [{ unitPriceCents: -1, quantity: 1 }],
    [{ unitPriceCents: 100, quantity: 0 }],
    [{ unitPriceCents: 100.5, quantity: 1 }],
    [{ unitPriceCents: 0, quantity: Number.MAX_SAFE_INTEGER + 1 }],
  ])("rejects invalid order lines: %o", (line) => {
    expect(() => calculateOrderTotals([line], 0)).toThrow(RangeError);
  });

  it("rejects negative delivery and discount values", () => {
    expect(() => calculateOrderTotals([], -1)).toThrow(RangeError);
    expect(() => calculateOrderTotals([], 0, -1)).toThrow(RangeError);
  });
});
