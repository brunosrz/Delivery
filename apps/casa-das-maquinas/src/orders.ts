import type {
  Charge,
  CreateOrderRequest,
  ErrorCode,
  Order,
  OrderStatus,
  Payer,
  Quote,
  SessionUser,
  StatusTransitionRequest,
  TimelineEvent,
} from "@delivery/contracts"
import { isOnlinePayment } from "@delivery/contracts"
import { type TransitionActor, checkTransition, quoteCart } from "@delivery/domain"
import { and, desc, eq, inArray } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"
import { canManageRestaurant } from "./auth.js"
import * as ordersSchema from "./db/orders-schema.js"
import { createPaymentsService, toCharge } from "./payments.js"
import { createCatalogRepository } from "./repositories/catalog.js"

type OrderRow = typeof ordersSchema.orders.$inferSelect
type EventRow = typeof ordersSchema.orderEvents.$inferSelect

export type ServiceError = { code: ErrorCode; message: string; fields?: Record<string, string[]> }
export type ServiceResult<T> = { ok: true; value: T } | { ok: false; error: ServiceError }

const failure = (
  code: ErrorCode,
  message: string,
  fields?: Record<string, string[]>,
): { ok: false; error: ServiceError } => ({
  ok: false,
  error: fields ? { code, message, fields } : { code, message },
})

/** JSON com chaves ordenadas: a mesma requisição sempre gera o mesmo hash. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`
  }
  return JSON.stringify(value)
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function toOrder(row: OrderRow, events: EventRow[], charge?: Charge): Order {
  const timeline: TimelineEvent[] = events.map((event) => ({
    status: event.status as OrderStatus,
    at: event.at,
    actorRole: event.actorRole,
    ...(event.reason ? { reason: event.reason } : {}),
  }))
  return {
    id: row.id,
    restaurantId: row.restaurantId,
    customerId: row.customerId,
    fulfillment: row.fulfillment,
    status: row.status,
    payment: { method: row.paymentMethod, status: row.paymentStatus },
    quote: JSON.parse(row.quoteJson) as Quote,
    ...(charge ? { charge } : {}),
    address: row.addressJson ? (JSON.parse(row.addressJson) as Order["address"]) : null,
    timeline,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/** Ator da transição derivado do papel; o cliente nunca informa o próprio papel. */
function actorFor(user: SessionUser, order: OrderRow): TransitionActor | null {
  if (user.role === "admin") return "system"
  if (user.role === "restaurant_staff" && canManageRestaurant(user, order.restaurantId)) return "restaurant_staff"
  if (user.role === "courier") return "courier"
  if (user.role === "customer" && order.customerId === user.id) return "customer"
  return null
}

function canRead(user: SessionUser, order: OrderRow): boolean {
  return order.customerId === user.id || canManageRestaurant(user, order.restaurantId) || user.role === "courier"
}

export function createOrdersService(env: Env) {
  const db = drizzle(env.DB, { schema: ordersSchema })
  const catalog = createCatalogRepository(env.DB)
  const payments = createPaymentsService(env)

  async function chargeFor(orderId: string): Promise<Charge | undefined> {
    const row = await payments.chargeForOrder(orderId)
    return row ? toCharge(row) : undefined
  }

  async function present(row: OrderRow): Promise<Order> {
    return toOrder(row, await eventsFor(row.id), await chargeFor(row.id))
  }

  async function eventsFor(orderId: string): Promise<EventRow[]> {
    return db
      .select()
      .from(ordersSchema.orderEvents)
      .where(eq(ordersSchema.orderEvents.orderId, orderId))
      .orderBy(ordersSchema.orderEvents.at)
  }

  async function findByKey(customerId: string, key: string): Promise<OrderRow | undefined> {
    const [row] = await db
      .select()
      .from(ordersSchema.orders)
      .where(and(eq(ordersSchema.orders.customerId, customerId), eq(ordersSchema.orders.idempotencyKey, key)))
      .limit(1)
    return row
  }

  async function replay(existing: OrderRow, hash: string): Promise<ServiceResult<{ order: Order; replayed: boolean }>> {
    if (existing.requestHash !== hash) {
      return failure("idempotency_mismatch", "a mesma Idempotency-Key foi usada com outro pedido")
    }
    return { ok: true, value: { order: await present(existing), replayed: true } }
  }

  return {
    async quote(input: Pick<CreateOrderRequest, "restaurantId" | "fulfillment" | "items" | "couponCode">) {
      const menu = await catalog.getMenuByRestaurantId(input.restaurantId)
      if (!menu) return failure("not_found", "restaurante não encontrado")
      const result = quoteCart(
        menu.restaurant,
        menu.sections.flatMap((section) => section.products),
        { fulfillment: input.fulfillment, items: input.items, couponCode: input.couponCode },
      )
      if (!result.ok) {
        const fields: Record<string, string[]> = {}
        for (const issue of result.issues) (fields[issue.path] ??= []).push(issue.message)
        return failure("bad_request", "pedido inválido", fields)
      }
      return { ok: true as const, value: result.quote satisfies Quote }
    },

    /**
     * Cria o pedido uma única vez por (cliente, Idempotency-Key). Repetir a mesma
     * chave com o mesmo corpo devolve o pedido original; com outro corpo, 422.
     */
    async create(
      user: SessionUser,
      idempotencyKey: string,
      request: CreateOrderRequest,
    ): Promise<ServiceResult<{ order: Order; replayed: boolean }>> {
      const hash = await sha256(canonicalJson(request))
      const existing = await findByKey(user.id, idempotencyKey)
      if (existing) return replay(existing, hash)

      const quoted = await this.quote(request)
      if (!quoted.ok) return quoted
      if (quoted.value.totalCents !== request.expectedTotalCents) {
        return failure("conflict", "o total do pedido mudou; revise a sacola", {
          expectedTotalCents: [`total atual: ${quoted.value.totalCents}`],
        })
      }

      const orderId = crypto.randomUUID()
      try {
        await db.batch([
          db.insert(ordersSchema.orders).values({
            id: orderId,
            restaurantId: request.restaurantId,
            customerId: user.id,
            fulfillment: request.fulfillment,
            status: "pending",
            paymentMethod: request.paymentMethod,
            quoteJson: JSON.stringify(quoted.value),
            addressJson: request.address ? JSON.stringify(request.address) : null,
            totalCents: quoted.value.totalCents,
            idempotencyKey,
            requestHash: hash,
          }),
          db.insert(ordersSchema.orderEvents).values({
            id: crypto.randomUUID(),
            orderId,
            restaurantId: request.restaurantId,
            status: "pending",
            actorRole: "customer",
            actorId: user.id,
          }),
        ])
      } catch (error) {
        // Corrida entre duas requisições com a mesma chave: a constraint única decide quem venceu.
        const winner = await findByKey(user.id, idempotencyKey)
        if (winner) return replay(winner, hash)
        throw error
      }

      // Pagamento online: a cobrança sai depois do pedido gravado. Se o Asaas falhar, o pedido continua
      // pendente sem cobrança e o cliente repete pela rota de pagamento (a emissão é idempotente).
      if (isOnlinePayment(request.paymentMethod)) {
        await payments.ensureCharge(
          {
            id: orderId,
            restaurantId: request.restaurantId,
            customerId: user.id,
            totalCents: quoted.value.totalCents,
            paymentMethod: request.paymentMethod as "pix" | "card",
          },
          request.payer,
        )
      }

      const created = await this.get(user, orderId)
      if (!created.ok) throw new Error("pedido recém-criado não encontrado")
      return { ok: true, value: { order: created.value, replayed: false } }
    },

    /** Pedido visível ao dono, à equipe do restaurante, a entregadores e à administração; os demais recebem 404. */
    async get(user: SessionUser, orderId: string): Promise<ServiceResult<Order>> {
      const [row] = await db.select().from(ordersSchema.orders).where(eq(ordersSchema.orders.id, orderId)).limit(1)
      if (!row || !canRead(user, row)) return failure("not_found", "pedido não encontrado")
      return { ok: true, value: await present(row) }
    },

    async listForCustomer(user: SessionUser): Promise<Order[]> {
      const rows = await db
        .select()
        .from(ordersSchema.orders)
        .where(eq(ordersSchema.orders.customerId, user.id))
        .orderBy(desc(ordersSchema.orders.createdAt))
        .limit(50)
      return Promise.all(rows.map((row) => present(row)))
    },

    async listForRestaurant(restaurantId: string): Promise<Order[]> {
      const rows = await db
        .select()
        .from(ordersSchema.orders)
        .where(eq(ordersSchema.orders.restaurantId, restaurantId))
        .orderBy(desc(ordersSchema.orders.createdAt))
        .limit(100)
      return Promise.all(rows.map((row) => present(row)))
    },

    /**
     * Entregas para o entregador: pedidos de entrega prontos para sair (qualquer restaurante) e as entregas em curso
     * que ele mesmo despachou. Só entregadores e administração.
     */
    async listForCourier(user: SessionUser): Promise<ServiceResult<Order[]>> {
      if (user.role !== "courier" && user.role !== "admin") return failure("forbidden", "apenas entregadores")
      const { results } = await env.DB.prepare(
        "select o.id from orders o where " +
          "(o.status = 'ready' and o.fulfillment = 'delivery') or " +
          "(o.status = 'dispatched' and exists (select 1 from order_events e where e.order_id = o.id and e.status = 'dispatched' and e.actor_id = ?)) " +
          "order by o.updated_at asc limit 50",
      )
        .bind(user.id)
        .all<{ id: string }>()
      if (results.length === 0) return { ok: true, value: [] }
      const rows = await db
        .select()
        .from(ordersSchema.orders)
        .where(
          inArray(
            ordersSchema.orders.id,
            results.map((row) => row.id),
          ),
        )
      const byId = new Map(rows.map((row) => [row.id, row]))
      const ordered = results.flatMap((row) => byId.get(row.id) ?? [])
      return { ok: true, value: await Promise.all(ordered.map((row) => present(row))) }
    },

    /** Emite (ou devolve) a cobrança online de um pedido do próprio cliente que ainda não foi paga. */
    async ensurePayment(user: SessionUser, orderId: string, payer: Payer | undefined): Promise<ServiceResult<Order>> {
      const [row] = await db.select().from(ordersSchema.orders).where(eq(ordersSchema.orders.id, orderId)).limit(1)
      if (!row || row.customerId !== user.id) return failure("not_found", "pedido não encontrado")
      if (!isOnlinePayment(row.paymentMethod)) return failure("bad_request", "este pedido é pago na entrega")
      if (row.status === "cancelled" || row.paymentStatus !== "pending") {
        return failure("conflict", "este pedido não aceita nova cobrança")
      }
      const charge = await payments.ensureCharge(
        {
          id: row.id,
          restaurantId: row.restaurantId,
          customerId: row.customerId,
          totalCents: row.totalCents,
          paymentMethod: row.paymentMethod as "pix" | "card",
        },
        payer,
      )
      if (!charge.ok) return failure(charge.error.code, charge.error.message)
      return { ok: true, value: await present(row) }
    },

    /**
     * Aplica uma transição validada pela máquina de estados. O UPDATE condicional
     * ao status lido garante que duas transições concorrentes não passem ambas.
     */
    async transition(
      user: SessionUser,
      orderId: string,
      request: StatusTransitionRequest,
    ): Promise<ServiceResult<Order>> {
      const [row] = await db.select().from(ordersSchema.orders).where(eq(ordersSchema.orders.id, orderId)).limit(1)
      if (!row || !canRead(user, row)) return failure("not_found", "pedido não encontrado")

      const actor = actorFor(user, row)
      if (!actor) return failure("forbidden", "sem permissão para alterar este pedido")

      const check = checkTransition(row.status, request.to, actor, row.fulfillment)
      if (!check.ok) {
        if (check.reason === "actor_not_allowed") return failure("forbidden", "seu papel não pode fazer esta transição")
        return failure("invalid_transition", `transição inválida: ${row.status} -> ${request.to} (${check.reason})`)
      }

      // Lote atômico: o evento só é gravado se o UPDATE condicional mudou exatamente uma linha
      // (changes() = 1). Uma transição concorrente que perdeu a corrida não deixa rastro.
      const now = new Date().toISOString()
      const [update] = await env.DB.batch([
        env.DB.prepare("update orders set status = ?, updated_at = ? where id = ? and status = ?").bind(
          request.to,
          now,
          orderId,
          row.status,
        ),
        env.DB.prepare(
          "insert into order_events (id, order_id, restaurant_id, status, actor_role, actor_id, reason, at) " +
            "select ?, ?, ?, ?, ?, ?, ?, ? where changes() = 1",
        ).bind(crypto.randomUUID(), orderId, row.restaurantId, request.to, actor, user.id, request.reason ?? null, now),
      ])

      if (update?.meta.changes !== 1) {
        return failure("invalid_transition", "o pedido mudou de status ao mesmo tempo; recarregue e tente de novo")
      }

      return this.get(user, orderId)
    },
  }
}
