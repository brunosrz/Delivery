import { sql } from "drizzle-orm"
import { check, index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"
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
    /** Digital (post, story, mensagem) ou físico (cartaz, cardápio impresso). */
    medium: text("medium", { enum: ["digital", "fisico"] })
      .notNull()
      .default("digital"),
    /** Categoria editorial (global ou do restaurante). Sem chave estrangeira: a coluna precisa poder ser removida no rollback. */
    categoryId: text("category_id"),
    body: text("body").notNull(),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    exportCount: integer("export_count").notNull().default(0),
    /** Preenchido quando vai para a lixeira; some de vez depois de 30 dias (retention.ts) ou ao excluir em definitivo. */
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull().default(isoNow),
    updatedAt: text("updated_at").notNull().default(isoNow),
  },
  (table) => [index("mkit_materials_restaurant_idx").on(table.restaurantId, table.updatedAt)],
)

/**
 * Categorias editoriais dos materiais. `restaurant_id` nulo = categoria padrão da plataforma (vale para todos); com
 * valor, é do restaurante. Dados editoriais ficam no banco, não no código.
 */
export const mkitCategories = sqliteTable(
  "mkit_categories",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id").references(() => restaurants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: text("created_at").notNull().default(isoNow),
  },
  (table) => [
    index("mkit_categories_restaurant_idx").on(table.restaurantId),
    uniqueIndex("mkit_categories_name_unique").on(table.restaurantId, table.name),
  ],
)

/** Datas comemorativas próprias do restaurante (aniversário da casa, prato do mês...), somadas ao calendário nacional. */
export const mkitCalendarEvents = sqliteTable(
  "mkit_calendar_events",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    /** Data no formato AAAA-MM-DD. */
    date: text("date").notNull(),
    name: text("name").notNull(),
    /** Repete todo ano no mesmo dia e mês. */
    recurring: integer("recurring", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default(isoNow),
  },
  (table) => [index("mkit_calendar_restaurant_idx").on(table.restaurantId, table.date)],
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

/** Contadores de limite de requisições: uma linha por chave e janela fixa. A chave é um hash, nunca o IP. */
export const rateLimitBuckets = sqliteTable(
  "rate_limit_buckets",
  {
    key: text("key").notNull(),
    /** Início da janela, em segundos desde a época. */
    windowStart: integer("window_start").notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.key, table.windowStart] }),
    index("rate_limit_window_idx").on(table.windowStart),
  ],
)

/**
 * Prova do consentimento de cookies (GDPR art. 7(1), LGPD art. 8 §2). Só guarda o identificador aleatório do navegador
 * e um hash do IP; `user_id` é preenchido quando havia sessão e é desfeito na exclusão da conta.
 */
export const consentRecords = sqliteTable(
  "consent_records",
  {
    id: text("id").primaryKey(),
    consentId: text("consent_id").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    version: integer("version").notNull(),
    analytics: integer("analytics", { mode: "boolean" }).notNull(),
    marketing: integer("marketing", { mode: "boolean" }).notNull(),
    source: text("source", { enum: ["banner", "preferences", "gpc"] }).notNull(),
    locale: text("locale").notNull(),
    ipHash: text("ip_hash"),
    createdAt: text("created_at").notNull().default(isoNow),
  },
  (table) => [
    index("consent_records_consent_idx").on(table.consentId, table.createdAt),
    index("consent_records_user_idx").on(table.userId),
    index("consent_records_created_idx").on(table.createdAt),
  ],
)

/** Aceite dos Termos de Uso e da Política de Privacidade, por versão do documento. */
export const legalAcceptances = sqliteTable(
  "legal_acceptances",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    document: text("document", { enum: ["terms", "privacy"] }).notNull(),
    version: text("version").notNull(),
    ipHash: text("ip_hash"),
    acceptedAt: text("accepted_at").notNull().default(isoNow),
  },
  (table) => [uniqueIndex("legal_acceptances_unique").on(table.userId, table.document, table.version)],
)

/**
 * Registro das solicitações do titular (exportação e exclusão), para demonstrar atendimento (LGPD art. 37, GDPR art. 5(2)).
 * Não tem chave estrangeira nem dado pessoal: o titular aparece só como hash, e o registro sobrevive à exclusão.
 */
export const dataRequests = sqliteTable(
  "data_requests",
  {
    id: text("id").primaryKey(),
    subjectHash: text("subject_hash").notNull(),
    type: text("type", { enum: ["export", "delete"] }).notNull(),
    status: text("status", { enum: ["completed", "refused"] }).notNull(),
    reason: text("reason"),
    createdAt: text("created_at").notNull().default(isoNow),
  },
  (table) => [index("data_requests_subject_idx").on(table.subjectHash, table.createdAt)],
)
