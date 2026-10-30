import { sql } from "drizzle-orm"
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

// Valores monetários são sempre inteiros em centavos. Toda tabela de catálogo
// carrega restaurant_id para que o isolamento por tenant (#14) seja aplicável
// em qualquer consulta, inclusive nas tabelas filhas.

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
}

export const restaurants = sqliteTable(
  "restaurants",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    logoUrl: text("logo_url"),
    coverUrl: text("cover_url"),
    timezone: text("timezone").notNull().default("America/Sao_Paulo"),
    isOpen: integer("is_open", { mode: "boolean" }).notNull().default(true),
    deliveryEnabled: integer("delivery_enabled", { mode: "boolean" }).notNull().default(true),
    pickupEnabled: integer("pickup_enabled", { mode: "boolean" }).notNull().default(true),
    deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
    minimumOrderCents: integer("minimum_order_cents").notNull().default(0),
    priority: integer("priority").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("restaurants_slug_unique").on(table.slug),
    check("restaurants_delivery_fee_non_negative", sql`${table.deliveryFeeCents} >= 0`),
    check("restaurants_minimum_order_non_negative", sql`${table.minimumOrderCents} >= 0`),
  ],
)

export const openingHours = sqliteTable(
  "opening_hours",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(),
    opensAt: integer("opens_at").notNull(),
    closesAt: integer("closes_at").notNull(),
  },
  (table) => [
    index("opening_hours_restaurant_idx").on(table.restaurantId),
    check("opening_hours_weekday_range", sql`${table.weekday} between 0 and 6`),
    check(
      "opening_hours_window",
      sql`${table.opensAt} >= 0 and ${table.closesAt} <= 1440 and ${table.opensAt} < ${table.closesAt}`,
    ),
  ],
)

export const menuSections = sqliteTable(
  "menu_sections",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [index("menu_sections_restaurant_idx").on(table.restaurantId, table.position)],
)

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    sectionId: text("section_id")
      .notNull()
      .references(() => menuSections.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    priceCents: integer("price_cents").notNull(),
    originalPriceCents: integer("original_price_cents"),
    available: integer("available", { mode: "boolean" }).notNull().default(true),
    maxQuantity: integer("max_quantity").notNull().default(10),
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("products_restaurant_slug_unique").on(table.restaurantId, table.slug),
    index("products_section_idx").on(table.sectionId, table.position),
    check("products_price_non_negative", sql`${table.priceCents} >= 0`),
    check("products_max_quantity_range", sql`${table.maxQuantity} between 1 and 99`),
  ],
)

export const addonGroups = sqliteTable(
  "addon_groups",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    minSelections: integer("min_selections").notNull().default(0),
    maxSelections: integer("max_selections").notNull().default(1),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    index("addon_groups_product_idx").on(table.productId, table.position),
    check(
      "addon_groups_selection_range",
      sql`${table.minSelections} >= 0 and ${table.maxSelections} >= 1 and ${table.minSelections} <= ${table.maxSelections}`,
    ),
  ],
)

export const addonOptions = sqliteTable(
  "addon_options",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    groupId: text("group_id")
      .notNull()
      .references(() => addonGroups.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    priceCents: integer("price_cents").notNull().default(0),
    available: integer("available", { mode: "boolean" }).notNull().default(true),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    index("addon_options_group_idx").on(table.groupId, table.position),
    check("addon_options_price_non_negative", sql`${table.priceCents} >= 0`),
  ],
)
