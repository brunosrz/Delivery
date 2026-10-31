import { ORDER_STATUSES, type OrderStatus, checkTransition } from "@delivery/domain"

type Fulfillment = "delivery" | "pickup"

/** Próximos status que a equipe do restaurante pode aplicar, pela mesma máquina de estados do servidor. */
export function nextActions(status: OrderStatus, fulfillment: Fulfillment): OrderStatus[] {
  return ORDER_STATUSES.filter((to) => checkTransition(status, to, "restaurant_staff", fulfillment).ok)
}

/** Colunas da fila, na ordem de trabalho; pedidos encerrados ficam fora. */
export const QUEUE_COLUMNS: { status: OrderStatus; title: string }[] = [
  { status: "pending", title: "Novos" },
  { status: "accepted", title: "Aceitos" },
  { status: "preparing", title: "Em preparo" },
  { status: "ready", title: "Prontos" },
  { status: "dispatched", title: "Em entrega" },
]

export function groupByStatus<T extends { status: OrderStatus }>(orders: readonly T[]): Map<OrderStatus, T[]> {
  const groups = new Map<OrderStatus, T[]>(QUEUE_COLUMNS.map((column) => [column.status, []]))
  for (const order of orders) groups.get(order.status)?.push(order)
  return groups
}
