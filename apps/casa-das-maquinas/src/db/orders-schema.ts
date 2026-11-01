import { sql } from "drizzle-orm"
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"
import { user } from "./auth-schema.js"
import { restaurants } from "./schema.js"

const isoNow = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    customerId: text("customer_id")
      .notNull()
      .references(() => user.id),
    fulfillment: text("fulfillment", { enum: ["delivery", "pickup"] }).notNull(),
    status: text("status", {
      enum: ["pending", "accepted", "preparing", "ready", "dispatched", "delivered", "cancelled"],
    }).notNull(),
    paymentMethod: text("payment_method", {
      enum: ["cash", "pix_on_delivery", "card_on_delivery", "pix", "card"],
    }).notNull(),
    paymentStatus: text("payment_status", { enum: ["pending", "paid", "failed", "refunded"] })
      .notNull()
      .default("pending"),
    /** Cotação congelada no momento do pedido (JSON do contrato Quote). */
    quoteJson: text("quote_json").notNull(),
    addressJson: text("address_json"),
    totalCents: integer("total_cents").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    /** SHA-256 do corpo canônico: a mesma chave com outro corpo é rejeitada. */
    requestHash: text("request_hash").notNull(),
    createdAt: text("created_at").notNull().default(isoNow),
    updatedAt: text("updated_at").notNull().default(isoNow),
  },
  (table) => [
    uniqueIndex("orders_customer_idempotency_unique").on(table.customerId, table.idempotencyKey),
    index("orders_restaurant_created_idx").on(table.restaurantId, table.createdAt),
    index("orders_customer_created_idx").on(table.customerId, table.createdAt),
    check("orders_total_non_negative", sql`${table.totalCents} >= 0`),
  ],
)

export const orderEvents = sqliteTable(
  "order_events",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    status: text("status").notNull(),
    actorRole: text("actor_role", { enum: ["customer", "restaurant_staff", "courier", "system"] }).notNull(),
    actorId: text("actor_id"),
    reason: text("reason"),
    at: text("at").notNull().default(isoNow),
  },
  (table) => [index("order_events_order_idx").on(table.orderId, table.at)],
)

/** Cobrança online emitida no Asaas para um pedido (uma por pedido). */
export const paymentCharges = sqliteTable(
  "payment_charges",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    provider: text("provider", { enum: ["asaas"] })
      .notNull()
      .default("asaas"),
    /** Identificador `pay_…` no Asaas; é por ele que o webhook encontra o pedido. */
    providerChargeId: text("provider_charge_id").notNull(),
    billingType: text("billing_type", { enum: ["PIX", "CREDIT_CARD", "UNDEFINED"] }).notNull(),
    invoiceUrl: text("invoice_url"),
    pixPayload: text("pix_payload"),
    pixQrImage: text("pix_qr_image"),
    pixExpiresAt: text("pix_expires_at"),
    createdAt: text("created_at").notNull().default(isoNow),
  },
  (table) => [
    uniqueIndex("payment_charges_order_unique").on(table.orderId),
    uniqueIndex("payment_charges_provider_charge_unique").on(table.provider, table.providerChargeId),
  ],
)

/** Vínculo entre o usuário e o cliente `cus_…` no Asaas, para não recriar clientes duplicados. */
export const asaasCustomers = sqliteTable("asaas_customers", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  asaasCustomerId: text("asaas_customer_id").notNull(),
  createdAt: text("created_at").notNull().default(isoNow),
})

/** Eventos de webhook já recebidos; o `id` do evento é a chave de deduplicação (entrega at least once). */
export const paymentWebhookEvents = sqliteTable("payment_webhook_events", {
  eventId: text("event_id").primaryKey(),
  event: text("event").notNull(),
  providerChargeId: text("provider_charge_id"),
  receivedAt: text("received_at").notNull().default(isoNow),
})

/**
 * Caixa de saída: cada mudança de pedido grava, na MESMA transação, o evento de tempo real a publicar.
 * A publicação imediata marca o job como `done`; se o Durable Object falhar depois do commit, o cron reenvia
 * (entrega at-least-once; a sala descarta repetição do mesmo evento).
 */
export const outboxJobs = sqliteTable(
  "outbox_jobs",
  {
    id: text("id").primaryKey(),
    kind: text("kind", { enum: ["live.publish"] })
      .notNull()
      .default("live.publish"),
    restaurantId: text("restaurant_id").notNull(),
    orderId: text("order_id").notNull(),
    /** JSON do evento: { type, orderId, status, at }. */
    payload: text("payload").notNull(),
    status: text("status", { enum: ["pending", "done", "dead"] })
      .notNull()
      .default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    createdAt: text("created_at").notNull().default(isoNow),
    updatedAt: text("updated_at").notNull().default(isoNow),
  },
  (table) => [
    index("outbox_jobs_status_created_idx").on(table.status, table.createdAt),
    index("outbox_jobs_order_idx").on(table.orderId),
    check("outbox_jobs_attempts_non_negative", sql`${table.attempts} >= 0`),
  ],
)

/** Mensagens do formulário de contato. O IP nunca é gravado: só um hash salgado, para limitar abuso. */
export const contactMessages = sqliteTable(
  "contact_messages",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    message: text("message").notNull(),
    ipHash: text("ip_hash").notNull(),
    createdAt: text("created_at").notNull().default(isoNow),
  },
  (table) => [index("contact_messages_ip_created_idx").on(table.ipHash, table.createdAt)],
)

/** Materiais de marketing (MKit) de um restaurante. O texto já chega limpo (ver sanitizeText nos contratos). */
export const mkitMaterials = sqliteTable(
  "mkit_materials",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    kind: text("kind", { enum: ["post", "cartaz", "promocao"] }).notNull(),
    body: text("body").notNull(),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    exportCount: integer("export_count").notNull().default(0),
    createdAt: text("created_at").notNull().default(isoNow),
    updatedAt: text("updated_at").notNull().default(isoNow),
  },
  (table) => [index("mkit_materials_restaurant_idx").on(table.restaurantId, table.updatedAt)],
)

/**
 * Uma linha por pedido que serializa a emissão da cobrança. O Asaas não tem Idempotency-Key e a busca por
 * externalReference não vê uma criação ainda em voo; sem isto, duas tentativas simultâneas poderiam criar duas
 * cobranças. A tentativa só segue se conseguir reivindicar o lease por UPDATE condicional.
 */
export const paymentAttempts = sqliteTable("payment_attempts", {
  orderId: text("order_id")
    .primaryKey()
    .references(() => orders.id, { onDelete: "cascade" }),
  state: text("state", { enum: ["not_created", "creating", "created", "creation_failed"] })
    .notNull()
    .default("not_created"),
  leaseExpiresAt: text("lease_expires_at"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  updatedAt: text("updated_at").notNull().default(isoNow),
})
