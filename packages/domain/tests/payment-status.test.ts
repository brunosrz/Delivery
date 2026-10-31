import { describe, expect, it } from "vitest"
import { PAYMENT_STATUSES, checkPaymentTransition } from "../src/index.js"

describe("checkPaymentTransition", () => {
  it.each([
    ["pending", "paid"],
    ["pending", "failed"],
    ["failed", "paid"],
    ["paid", "refunded"],
  ] as const)("permite %s -> %s", (from, to) => {
    expect(checkPaymentTransition(from, to)).toEqual({ ok: true, noop: false })
  })

  it.each(PAYMENT_STATUSES)("trata repetir %s como no-op", (status) => {
    expect(checkPaymentTransition(status, status)).toEqual({ ok: true, noop: true })
  })

  it.each([
    ["pending", "refunded"],
    ["failed", "refunded"],
    ["paid", "failed"],
    ["paid", "pending"],
  ] as const)("recusa %s -> %s", (from, to) => {
    expect(checkPaymentTransition(from, to)).toEqual({ ok: false, reason: "invalid_transition" })
  })

  it("recusa qualquer saída de refunded", () => {
    expect(checkPaymentTransition("refunded", "paid")).toEqual({ ok: false, reason: "terminal_state" })
  })
})
