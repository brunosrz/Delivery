export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "dispatched",
  "delivered",
  "cancelled",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type TransitionActor = "customer" | "restaurant_staff" | "courier" | "system"

type Rule = { to: OrderStatus; actors: readonly TransitionActor[] }

// Fluxo de entrega. Retirada pula "dispatched": o restaurante vai de "ready" a "delivered".
const RULES: Record<OrderStatus, readonly Rule[]> = {
  pending: [
    { to: "accepted", actors: ["restaurant_staff"] },
    { to: "cancelled", actors: ["customer", "restaurant_staff", "system"] },
  ],
  accepted: [
    { to: "preparing", actors: ["restaurant_staff"] },
    { to: "cancelled", actors: ["restaurant_staff", "system"] },
  ],
  preparing: [
    { to: "ready", actors: ["restaurant_staff"] },
    { to: "cancelled", actors: ["restaurant_staff", "system"] },
  ],
  ready: [
    { to: "dispatched", actors: ["courier"] },
    { to: "delivered", actors: ["restaurant_staff"] },
  ],
  dispatched: [{ to: "delivered", actors: ["courier"] }],
  delivered: [],
  cancelled: [],
}

export type TransitionCheck =
  | { ok: true }
  | {
      ok: false
      reason: "same_status" | "terminal_status" | "not_allowed" | "actor_not_allowed" | "pickup_skips_dispatch"
    }

export function isTerminal(status: OrderStatus): boolean {
  return RULES[status].length === 0
}

/**
 * Valida uma transição de status. Repetir o status atual, sair de um estado
 * terminal, pular etapas ou usar um papel sem permissão é rejeitado.
 */
export function checkTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor: TransitionActor,
  fulfillment: "delivery" | "pickup",
): TransitionCheck {
  if (from === to) return { ok: false, reason: "same_status" }
  if (isTerminal(from)) return { ok: false, reason: "terminal_status" }
  if (fulfillment === "pickup" && to === "dispatched") return { ok: false, reason: "pickup_skips_dispatch" }
  if (fulfillment === "delivery" && from === "ready" && to === "delivered") return { ok: false, reason: "not_allowed" }
  const rule = RULES[from].find((candidate) => candidate.to === to)
  if (!rule) return { ok: false, reason: "not_allowed" }
  if (!rule.actors.includes(actor)) return { ok: false, reason: "actor_not_allowed" }
  return { ok: true }
}
