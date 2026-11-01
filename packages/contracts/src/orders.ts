import { ORDER_STATUSES } from "@delivery/domain"
import { z } from "zod"
import { Cents, Id, Timestamp } from "./common.js"
import { Charge, Payer, PaymentMethod, isOnlinePayment } from "./payments.js"

export const CartItemInput = z
  .object({
    productId: Id,
    quantity: z.number().int().positive().max(99),
    addonOptionIds: z.array(Id).max(50).default([]),
    notes: z.string().trim().max(280).optional(),
  })
  .strict()
export type CartItemInput = z.infer<typeof CartItemInput>

export const FulfillmentType = z.enum(["delivery", "pickup"])

export const Address = z
  .object({
    street: z.string().min(1).max(160),
    number: z.string().min(1).max(20),
    complement: z.string().max(80).optional(),
    district: z.string().min(1).max(80),
    city: z.string().min(1).max(80),
    state: z.string().length(2),
    postalCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  })
  .strict()
export type Address = z.infer<typeof Address>

/**
 * Pedido de cotação. O cliente nunca envia preços: o backend recalcula tudo
 * a partir do catálogo, e um total enviado pelo cliente é rejeitado.
 */
export const QuoteRequest = z
  .object({
    restaurantId: Id,
    fulfillment: FulfillmentType,
    items: z.array(CartItemInput).min(1).max(50),
    couponCode: z.string().max(40).optional(),
  })
  .strict()
export type QuoteRequest = z.infer<typeof QuoteRequest>

export const QuoteLine = z.object({
  productId: Id,
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPriceCents: Cents,
  addonsCents: Cents,
  lineTotalCents: Cents,
})

export const Quote = z.object({
  restaurantId: Id,
  lines: z.array(QuoteLine).min(1),
  subtotalCents: Cents,
  deliveryCents: Cents,
  discountCents: Cents,
  totalCents: Cents,
})
export type Quote = z.infer<typeof Quote>

export const CreateOrderRequest = z
  .object({
    restaurantId: Id,
    fulfillment: FulfillmentType,
    items: z.array(CartItemInput).min(1).max(50),
    address: Address.optional(),
    paymentMethod: PaymentMethod,
    /** Obrigatório nos métodos online (pix e card); ver `Payer`. */
    payer: Payer.optional(),
    couponCode: z.string().max(40).optional(),
    /** Total que o cliente viu; o backend rejeita com `conflict` se diferir da cotação atual. */
    expectedTotalCents: Cents,
  })
  .strict()
  .refine((order) => order.fulfillment === "pickup" || order.address !== undefined, {
    message: "endereço é obrigatório para entrega",
    path: ["address"],
  })
  .refine((order) => !isOnlinePayment(order.paymentMethod) || order.payer !== undefined, {
    message: "dados do pagador são obrigatórios no pagamento online",
    path: ["payer"],
  })
export type CreateOrderRequest = z.infer<typeof CreateOrderRequest>

export const OrderStatus = z.enum(ORDER_STATUSES)
export type OrderStatus = z.infer<typeof OrderStatus>

export const PaymentStatus = z.enum(["pending", "paid", "failed", "refunded"])

export const TimelineEvent = z.object({
  status: OrderStatus,
  at: Timestamp,
  actorRole: z.enum(["customer", "restaurant_staff", "courier", "system"]),
  reason: z.string().max(280).optional(),
})
export type TimelineEvent = z.infer<typeof TimelineEvent>

export const Order = z
  .object({
    id: Id,
    restaurantId: Id,
    customerId: Id,
    fulfillment: FulfillmentType,
    status: OrderStatus,
    payment: z.object({ method: PaymentMethod, status: PaymentStatus }),
    quote: Quote,
    /** Cobrança online (Asaas); ausente nos pagamentos na entrega ou enquanto a cobrança não foi emitida. */
    charge: Charge.nullable().optional(),
    address: Address.nullable(),
    timeline: z.array(TimelineEvent).min(1),
    createdAt: Timestamp,
    updatedAt: Timestamp,
  })
  .refine((order) => order.fulfillment === "pickup" || order.address !== null, {
    message: "endereço é obrigatório para entrega",
    path: ["address"],
  })
export type Order = z.infer<typeof Order>

export const StatusTransitionRequest = z
  .object({
    to: OrderStatus,
    reason: z.string().max(280).optional(),
  })
  .strict()
export type StatusTransitionRequest = z.infer<typeof StatusTransitionRequest>
