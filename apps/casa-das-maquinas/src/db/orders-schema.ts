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
    paymentMethod: text("payment_method", { enum: ["cash", "pix_on_delivery", "card_on_delivery"] }).notNull(),
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
