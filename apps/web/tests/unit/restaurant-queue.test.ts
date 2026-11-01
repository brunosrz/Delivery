import { describe, expect, it } from "vitest"
import { groupByStatus, nextActions } from "@/lib/restaurant-queue"

describe("nextActions", () => {
  it("novo pedido: aceitar ou cancelar", () => {
    expect(nextActions("pending", "delivery")).toEqual(["accepted", "cancelled"])
  })

  it("pronto: retirada o restaurante entrega; entrega fica com o entregador", () => {
    expect(nextActions("ready", "pickup")).toContain("delivered")
    expect(nextActions("ready", "delivery")).not.toContain("delivered")
    expect(nextActions("ready", "delivery")).not.toContain("dispatched")
  })

  it("pedidos encerrados não têm ações", () => {
    expect(nextActions("delivered", "delivery")).toEqual([])
    expect(nextActions("cancelled", "pickup")).toEqual([])
  })
})

describe("groupByStatus", () => {
  it("agrupa pelas colunas da fila e ignora pedidos encerrados", () => {
    const groups = groupByStatus([
      { id: "a", status: "pending" as const },
      { id: "b", status: "preparing" as const },
      { id: "c", status: "pending" as const },
      { id: "d", status: "delivered" as const },
    ])
    expect(groups.get("pending")?.map((order) => order.id)).toEqual(["a", "c"])
    expect(groups.get("preparing")?.map((order) => order.id)).toEqual(["b"])
    expect(groups.get("delivered")).toBeUndefined()
  })
})
