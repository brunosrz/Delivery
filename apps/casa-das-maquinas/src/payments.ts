import type { Charge, ErrorCode, Payer } from "@delivery/contracts"
import { type PaymentStatus, checkPaymentTransition } from "@delivery/domain"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"
import { z } from "zod"
import {
  type AsaasBillingType,
  type AsaasClient,
  AsaasError,
  asaasConfigFrom,
  asaasDateTimeToIso,
  createAsaasClient,
} from "./asaas.js"
import * as schema from "./db/orders-schema.js"

type ChargeRow = typeof schema.paymentCharges.$inferSelect

export type PaymentFailure = { ok: false; error: { code: ErrorCode; message: string } }
export type PaymentResult<T> = { ok: true; value: T } | PaymentFailure

const fail = (code: ErrorCode, message: string): PaymentFailure => ({ ok: false, error: { code, message } })

/** Evento do Asaas → status do pagamento. Eventos fora da tabela (visualizações, split, negativação…) são só registrados. */
const STATUS_BY_EVENT: Readonly<Record<string, PaymentStatus>> = {
  PAYMENT_CONFIRMED: "paid",
  PAYMENT_RECEIVED: "paid",
  PAYMENT_REFUNDED: "refunded",
  PAYMENT_OVERDUE: "failed",
  PAYMENT_DELETED: "failed",
  PAYMENT_CREDIT_CARD_CAPTURE_REFUSED: "failed",
  PAYMENT_REPROVED_BY_RISK_ANALYSIS: "failed",
}

/** O Asaas pode acrescentar campos ao payload; tudo o que não usamos é ignorado, nunca erro. */
const WebhookEvent = z.object({
  id: z.string().min(1).max(200),
  event: z.string().min(1).max(100),
  payment: z
    .object({
      id: z.string().min(1).max(100),
      value: z.number().optional(),
    })
    .optional(),
})

export function toCharge(row: ChargeRow): Charge {
  return {
    provider: "asaas",
    chargeId: row.providerChargeId,
    invoiceUrl: row.invoiceUrl,
    pix:
      row.pixPayload && row.pixQrImage
        ? { payload: row.pixPayload, qrCodeImage: row.pixQrImage, expiresAt: asaasDateTimeToIso(row.pixExpiresAt) }
        : null,
  }
}

/** Comparação em tempo constante para o token do webhook. */
function safeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a)
  const right = new TextEncoder().encode(b)
  let diff = left.length ^ right.length
  for (let i = 0; i < Math.max(left.length, right.length); i++) diff |= (left[i] ?? 0) ^ (right[i] ?? 0)
  return diff === 0
}

/** Pix vence no dia seguinte; o QR Code expira 12 meses depois do vencimento (doc do Asaas). */
function dueDate(now = new Date()): string {
  return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function mapAsaasError(error: unknown): PaymentFailure {
  if (error instanceof AsaasError) {
    if (error.kind === "rate_limited") return fail("rate_limited", "muitas tentativas; tente de novo em instantes")
    if (error.kind === "rejected") return fail("bad_request", "o provedor de pagamento recusou os dados do pagador")
  }
  // Chave inválida e indisponibilidade não são problema do cliente: mensagem genérica, detalhe só no log.
  return fail("unavailable", "pagamento online indisponível no momento")
}

export type ChargeableOrder = {
  id: string
  restaurantId: string
  customerId: string
  totalCents: number
  paymentMethod: "pix" | "card"
}

export type AppliedPayment = {
  orderId: string
  restaurantId: string
  paymentStatus: PaymentStatus
  orderStatus: string
  updatedAt: string
}
export type WebhookOutcome =
  { kind: "duplicate" } | { kind: "ignored"; reason: string } | { kind: "applied"; applied: AppliedPayment }

export function createPaymentsService(env: Env, injected?: AsaasClient) {
  const db = drizzle(env.DB, { schema })

  function client(): AsaasClient | null {
    if (injected) return injected
    const config = asaasConfigFrom(env)
    return config ? createAsaasClient(config) : null
  }

  async function chargeForOrder(orderId: string): Promise<ChargeRow | undefined> {
    const [row] = await db
      .select()
      .from(schema.paymentCharges)
      .where(eq(schema.paymentCharges.orderId, orderId))
      .limit(1)
    return row
  }

  return {
    chargeForOrder,

    /**
     * Garante uma cobrança por pedido. Sem Idempotency-Key no Asaas, a deduplicação é local (linha única por
     * pedido) e remota (busca por `externalReference` antes de criar), então repetir a chamada não cobra duas vezes.
     */
    async ensureCharge(order: ChargeableOrder, payer: Payer | undefined): Promise<PaymentResult<Charge>> {
      const existing = await chargeForOrder(order.id)
      if (existing) return { ok: true, value: toCharge(existing) }

      const asaas = client()
      if (!asaas) return fail("unavailable", "pagamento online não configurado")

      try {
        const [linked] = await db
          .select()
          .from(schema.asaasCustomers)
          .where(eq(schema.asaasCustomers.userId, order.customerId))
          .limit(1)
        let customerId = linked?.asaasCustomerId
        if (!customerId) {
          if (!payer) return fail("bad_request", "dados do pagador são obrigatórios")
          const customer = await asaas.createCustomer({ ...payer, externalReference: order.customerId })
          customerId = customer.id
          await db
            .insert(schema.asaasCustomers)
            .values({ userId: order.customerId, asaasCustomerId: customerId })
            .onConflictDoNothing()
        }

        const billingType: AsaasBillingType = order.paymentMethod === "pix" ? "PIX" : "UNDEFINED"
        const payment =
          (await asaas.findPaymentByReference(order.id)) ??
          (await asaas.createPayment({
            customer: customerId,
            billingType,
            value: order.totalCents / 100,
            dueDate: dueDate(),
            externalReference: order.id,
            description: `Pedido ${order.id.slice(0, 8)}`,
          }))

        const qr = billingType === "PIX" ? await asaas.getPixQrCode(payment.id) : null
        await db
          .insert(schema.paymentCharges)
          .values({
            id: crypto.randomUUID(),
            orderId: order.id,
            restaurantId: order.restaurantId,
            providerChargeId: payment.id,
            billingType,
            invoiceUrl: payment.invoiceUrl,
            pixPayload: qr?.payload ?? null,
            pixQrImage: qr?.encodedImage ?? null,
            pixExpiresAt: qr?.expirationDate ?? null,
          })
          .onConflictDoNothing()

        const saved = await chargeForOrder(order.id)
        return saved ? { ok: true, value: toCharge(saved) } : fail("internal", "cobrança não registrada")
      } catch (error) {
        console.error(
          JSON.stringify({
            level: "error",
            event: "asaas_charge_failed",
            orderId: order.id,
            kind: error instanceof AsaasError ? error.kind : "unexpected",
            status: error instanceof AsaasError ? error.status : undefined,
          }),
        )
        return mapAsaasError(error)
      }
    },

    /**
     * Aplica um evento do Asaas. Idempotente: o `id` do evento é único e o UPDATE é condicional ao status lido.
     * Eventos desconhecidos ou de cobranças que não são nossas são reconhecidos (200) para não pausar a fila do Asaas.
     */
    async handleWebhook(token: string | null, rawBody: string): Promise<PaymentResult<WebhookOutcome>> {
      const expected = env.ASAAS_WEBHOOK_TOKEN
      if (!expected || !token || !safeEqual(token, expected))
        return fail("unauthenticated", "token do webhook inválido")

      let json: unknown
      try {
        json = JSON.parse(rawBody)
      } catch {
        return fail("bad_request", "corpo inválido")
      }
      const parsed = WebhookEvent.safeParse(json)
      if (!parsed.success) return fail("bad_request", "evento inválido")
      const { id: eventId, event, payment } = parsed.data

      const [seen] = await db
        .select({ eventId: schema.paymentWebhookEvents.eventId })
        .from(schema.paymentWebhookEvents)
        .where(eq(schema.paymentWebhookEvents.eventId, eventId))
        .limit(1)
      if (seen) return { ok: true, value: { kind: "duplicate" } }

      const record = () =>
        db
          .insert(schema.paymentWebhookEvents)
          .values({ eventId, event, providerChargeId: payment?.id ?? null })
          .onConflictDoNothing()

      const target = STATUS_BY_EVENT[event]
      if (!target || !payment) {
        await record()
        return { ok: true, value: { kind: "ignored", reason: "evento sem efeito no pedido" } }
      }

      const [charge] = await db
        .select()
        .from(schema.paymentCharges)
        .where(eq(schema.paymentCharges.providerChargeId, payment.id))
        .limit(1)
      if (!charge) {
        await record()
        return { ok: true, value: { kind: "ignored", reason: "cobrança desconhecida" } }
      }

      for (let attempt = 0; attempt < 3; attempt++) {
        const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, charge.orderId)).limit(1)
        if (!order) {
          await record()
          return { ok: true, value: { kind: "ignored", reason: "pedido não encontrado" } }
        }
        if (typeof payment.value === "number" && Math.round(payment.value * 100) !== order.totalCents) {
          console.error(JSON.stringify({ level: "error", event: "asaas_amount_mismatch", orderId: order.id, eventId }))
          await record()
          return { ok: true, value: { kind: "ignored", reason: "valor diverge do pedido" } }
        }
        const check = checkPaymentTransition(order.paymentStatus, target)
        if (!check.ok) {
          await record()
          return {
            ok: true,
            value: { kind: "ignored", reason: `transição ${order.paymentStatus} -> ${target} inválida` },
          }
        }
        if (check.noop) {
          await record()
          return { ok: true, value: { kind: "ignored", reason: "pagamento já estava neste estado" } }
        }

        // Atômico: o evento só fica registrado se o UPDATE condicional mudou exatamente uma linha.
        const now = new Date().toISOString()
        const [update] = await env.DB.batch([
          env.DB.prepare(
            "update orders set payment_status = ?, updated_at = ? where id = ? and payment_status = ?",
          ).bind(target, now, order.id, order.paymentStatus),
          env.DB.prepare(
            "insert or ignore into payment_webhook_events (event_id, event, provider_charge_id, received_at) select ?, ?, ?, ? where changes() = 1",
          ).bind(eventId, event, payment.id, now),
          // O pagamento muda o pedido: avisa o painel pela caixa de saída (só se o evento acima foi gravado).
          env.DB.prepare(
            "insert into outbox_jobs (id, restaurant_id, order_id, payload) select ?, ?, ?, ? where changes() = 1",
          ).bind(
            crypto.randomUUID(),
            order.restaurantId,
            order.id,
            JSON.stringify({ type: "order.updated", orderId: order.id, status: order.status, at: now }),
          ),
        ])
        if (update?.meta.changes === 1) {
          return {
            ok: true,
            value: {
              kind: "applied",
              applied: {
                orderId: order.id,
                restaurantId: order.restaurantId,
                paymentStatus: target,
                orderStatus: order.status,
                updatedAt: now,
              },
            },
          }
        }
        // Perdeu a corrida para outro evento: relê o status e reavalia.
      }
      return fail("conflict", "pagamento mudou ao mesmo tempo; o Asaas vai reenviar o evento")
    },
  }
}
