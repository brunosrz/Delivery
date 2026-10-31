export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

// pending -> paid | failed; failed -> paid (nova tentativa); paid -> refunded. refunded é terminal.
const RULES: Record<PaymentStatus, readonly PaymentStatus[]> = {
  pending: ["paid", "failed"],
  failed: ["paid"],
  paid: ["refunded"],
  refunded: [],
}

export type PaymentTransitionCheck =
  { ok: true; noop: boolean } | { ok: false; reason: "invalid_transition" | "terminal_state" }

/** Valida a mudança de status do pagamento. Repetir o status atual é um no-op, não um erro (eventos at-least-once). */
export function checkPaymentTransition(from: PaymentStatus, to: PaymentStatus): PaymentTransitionCheck {
  if (from === to) return { ok: true, noop: true }
  if (RULES[from].length === 0) return { ok: false, reason: "terminal_state" }
  return RULES[from].includes(to) ? { ok: true, noop: false } : { ok: false, reason: "invalid_transition" }
}
