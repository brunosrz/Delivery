import type { AddonGroup, Menu, Product, Restaurant } from "@delivery/contracts"
import { asc, desc, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"
import * as schema from "../db/schema.js"

type RestaurantRow = typeof schema.restaurants.$inferSelect
type OpeningHoursRow = typeof schema.openingHours.$inferSelect

function toRestaurant(row: RestaurantRow, hours: OpeningHoursRow[]): Restaurant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    logoUrl: row.logoUrl,
    coverUrl: row.coverUrl,
    timezone: row.timezone,
    isOpen: row.isOpen,
    deliveryEnabled: row.deliveryEnabled,
    pickupEnabled: row.pickupEnabled,
    deliveryFeeCents: row.deliveryFeeCents,
    minimumOrderCents: row.minimumOrderCents,
    openingHours: hours.map(({ weekday, opensAt, closesAt }) => ({ weekday, opensAt, closesAt })),
  }
}

function groupBy<T, K>(rows: T[], key: (row: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>()
  for (const row of rows) {
    const list = groups.get(key(row))
    if (list) list.push(row)
    else groups.set(key(row), [row])
  }
  return groups
}

export function createCatalogRepository(d1: D1Database) {
  const db = drizzle(d1, { schema })

  /** Monta o cardápio a partir do restaurante já resolvido; toda consulta filha usa o restaurant_id dele. */
  async function loadMenu(restaurant: RestaurantRow): Promise<Menu> {
    const tenant = restaurant.id
    const [hours, sections, products, groups, options] = await Promise.all([
      db.select().from(schema.openingHours).where(eq(schema.openingHours.restaurantId, tenant)),
      db
        .select()
        .from(schema.menuSections)
        .where(eq(schema.menuSections.restaurantId, tenant))
        .orderBy(asc(schema.menuSections.position)),
      db
        .select()
        .from(schema.products)
        .where(eq(schema.products.restaurantId, tenant))
        .orderBy(asc(schema.products.position)),
      db
        .select()
        .from(schema.addonGroups)
        .where(eq(schema.addonGroups.restaurantId, tenant))
        .orderBy(asc(schema.addonGroups.position)),
      db
        .select()
        .from(schema.addonOptions)
        .where(eq(schema.addonOptions.restaurantId, tenant))
        .orderBy(asc(schema.addonOptions.position)),
    ])

    const optionsByGroup = groupBy(options, (row) => row.groupId)
    const groupsByProduct = groupBy(groups, (row) => row.productId)
    const productsBySection = groupBy(products, (row) => row.sectionId)

    const toAddonGroup = (group: (typeof groups)[number]): AddonGroup => ({
      id: group.id,
      name: group.name,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      options: (optionsByGroup.get(group.id) ?? []).map((option) => ({
        id: option.id,
        name: option.name,
        priceCents: option.priceCents,
        available: option.available,
      })),
    })

    const toProduct = (product: (typeof products)[number]): Product => ({
      id: product.id,
      restaurantId: product.restaurantId,
      slug: product.slug,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      priceCents: product.priceCents,
      originalPriceCents: product.originalPriceCents,
      available: product.available,
      maxQuantity: product.maxQuantity,
      // Um grupo sem opções não é selecionável e quebraria o contrato (options.min(1)).
      addonGroups: (groupsByProduct.get(product.id) ?? [])
        .filter((group) => optionsByGroup.has(group.id))
        .map(toAddonGroup),
    })

    return {
      restaurant: toRestaurant(restaurant, hours),
      sections: sections.map((section) => ({
        id: section.id,
        name: section.name,
        position: section.position,
        products: (productsBySection.get(section.id) ?? []).map(toProduct),
      })),
    }
  }

  return {
    async listRestaurants(): Promise<Restaurant[]> {
      const [rows, hours] = await Promise.all([
        db.select().from(schema.restaurants).orderBy(desc(schema.restaurants.priority), asc(schema.restaurants.name)),
        db.select().from(schema.openingHours).orderBy(asc(schema.openingHours.weekday)),
      ])
      const hoursByRestaurant = groupBy(hours, (row) => row.restaurantId)
      return rows.map((row) => toRestaurant(row, hoursByRestaurant.get(row.id) ?? []))
    },

    async getRestaurantById(id: string): Promise<Restaurant | null> {
      const [row] = await db.select().from(schema.restaurants).where(eq(schema.restaurants.id, id)).limit(1)
      if (!row) return null
      const hours = await db.select().from(schema.openingHours).where(eq(schema.openingHours.restaurantId, id))
      return toRestaurant(row, hours)
    },

    /**
     * Cardápio completo de um restaurante. Toda consulta filha é filtrada pelo
     * restaurant_id resolvido a partir do slug, nunca por ids vindos do cliente.
     */
    async getMenuBySlug(slug: string): Promise<Menu | null> {
      const [restaurant] = await db.select().from(schema.restaurants).where(eq(schema.restaurants.slug, slug)).limit(1)
      return restaurant ? loadMenu(restaurant) : null
    },

    async getMenuByRestaurantId(id: string): Promise<Menu | null> {
      const [restaurant] = await db.select().from(schema.restaurants).where(eq(schema.restaurants.id, id)).limit(1)
      return restaurant ? loadMenu(restaurant) : null
    },
  }
}
