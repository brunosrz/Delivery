import { describe, expect, it } from "vitest"
import { ORDER_STATUSES, checkTransition, isTerminal, type OrderStatus } from "../src/index.js"

describe("checkTransition", () => {
  it.each([
    ["pending", "accepted", "restaurant_staff", "delivery"],
    ["accepted", "preparing", "restaurant_staff", "delivery"],
    ["preparing", "ready", "restaurant_staff", "delivery"],
    ["ready", "dispatched", "courier", "delivery"],
    ["dispatched", "delivered", "courier", "delivery"],
    ["ready", "delivered", "restaurant_staff", "pickup"],
    ["pending", "cancelled", "customer", "delivery"],
    ["preparing", "cancelled", "system", "pickup"],
  ] as const)("permite %s -> %s por %s (%s)", (from, to, actor, fulfillment) => {
    expect(checkTransition(from, to, actor, fulfillment)).toEqual({ ok: true })
  })

  it("rejeita repetir o status atual", () => {
    expect(checkTransition("accepted", "accepted", "restaurant_staff", "delivery")).toEqual({
      ok: false,
      reason: "same_status",
    })
  })

  it.each(["delivered", "cancelled"] as const)("não sai do estado terminal %s", (from) => {
    expect(checkTransition(from, "pending", "system", "delivery")).toEqual({ ok: false, reason: "terminal_status" })
  })

  it("rejeita pular etapas", () => {
    expect(checkTransition("pending", "ready", "restaurant_staff", "delivery")).toEqual({
      ok: false,
      reason: "not_allowed",
    })
  })

  it("rejeita voltar etapas", () => {
    expect(checkTransition("ready", "preparing", "restaurant_staff", "delivery")).toEqual({
      ok: false,
      reason: "not_allowed",
    })
  })

  it("rejeita papel sem permissão", () => {
    expect(checkTransition("pending", "accepted", "customer", "delivery")).toEqual({
      ok: false,
      reason: "actor_not_allowed",
    })
    expect(checkTransition("accepted", "cancelled", "customer", "delivery")).toEqual({
      ok: false,
      reason: "actor_not_allowed",
    })
  })

  it("retirada não passa por despacho e entrega exige o entregador", () => {
    expect(checkTransition("ready", "dispatched", "courier", "pickup")).toEqual({
      ok: false,
      reason: "pickup_skips_dispatch",
    })
    expect(checkTransition("ready", "delivered", "restaurant_staff", "delivery")).toEqual({
      ok: false,
      reason: "not_allowed",
    })
  })

  it("só delivered e cancelled são terminais", () => {
    const terminal = ORDER_STATUSES.filter((status: OrderStatus) => isTerminal(status))
    expect(terminal).toEqual(["delivered", "cancelled"])
  })
})
