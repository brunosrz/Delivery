import type {
  CreateMkitCalendarEvent,
  CreateMkitCategory,
  CreateMkitMaterial,
  GenerateMkitMaterial,
  MkitCalendarEvent,
  MkitCategory,
  MkitMaterial,
  MkitMetrics,
  SessionUser,
  UpdateMkitMaterial,
} from "@delivery/contracts"
import { sanitizeText } from "@delivery/domain"
import { and, asc, desc, eq, isNotNull, isNull, or, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"
import { canManageRestaurant } from "./auth.js"
import * as catalogSchema from "./db/schema.js"
import * as ordersSchema from "./db/orders-schema.js"
import { renderTemplate } from "./mkit-templates.js"

const schema = { ...catalogSchema, ...ordersSchema }
type Row = typeof schema.mkitMaterials.$inferSelect

/** Limites por restaurante, para um painel comprometido não encher o banco. */
export const MAX_MATERIALS_PER_RESTAURANT = 200
export const MAX_CATEGORIES_PER_RESTAURANT = 30
export const MAX_CALENDAR_EVENTS_PER_RESTAURANT = 100

export type MkitResult<T> =
  { ok: true; value: T } | { ok: false; code: "bad_request" | "forbidden" | "not_found" | "conflict"; message: string }

const toMaterial = (row: Row): MkitMaterial => ({
  id: row.id,
  restaurantId: row.restaurantId,
  title: row.title,
  kind: row.kind,
  body: row.body,
  medium: row.medium,
  categoryId: row.categoryId,
  status: row.status,
  exportCount: row.exportCount,
  deletedAt: row.deletedAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})

const forbidden = { ok: false, code: "forbidden", message: "sem acesso a este restaurante" } as const
const notFound = { ok: false, code: "not_found", message: "material não encontrado" } as const
const badCategory = { ok: false, code: "bad_request", message: "categoria inexistente" } as const

export function createMkitService(env: Env) {
  const db = drizzle(env.DB, { schema })
  const t = schema.mkitMaterials
  const categories = schema.mkitCategories
  const events = schema.mkitCalendarEvents

  /** Material do restaurante. Por padrão só os ativos; `trashed` busca os da lixeira. */
  async function find(restaurantId: string, id: string, trashed = false): Promise<Row | undefined> {
    const [row] = await db
      .select()
      .from(t)
      .where(
        and(eq(t.id, id), eq(t.restaurantId, restaurantId), trashed ? isNotNull(t.deletedAt) : isNull(t.deletedAt)),
      )
      .limit(1)
    return row
  }

  /** A categoria existe e é da plataforma ou do próprio restaurante (nunca de outro). */
  async function categoryUsable(restaurantId: string, categoryId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          or(isNull(categories.restaurantId), eq(categories.restaurantId, restaurantId)),
        ),
      )
      .limit(1)
    return row !== undefined
  }

  async function activeCount(restaurantId: string): Promise<number> {
    const [{ total } = { total: 0 }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(t)
      .where(and(eq(t.restaurantId, restaurantId), isNull(t.deletedAt)))
    return total
  }

  async function insertMaterial(
    restaurantId: string,
    input: {
      title: string
      kind: Row["kind"]
      body: string
      medium?: Row["medium"]
      categoryId?: string | null
    },
  ): Promise<MkitResult<MkitMaterial>> {
    if (input.categoryId && !(await categoryUsable(restaurantId, input.categoryId))) return badCategory
    if ((await activeCount(restaurantId)) >= MAX_MATERIALS_PER_RESTAURANT) {
      return { ok: false, code: "conflict", message: "limite de materiais do restaurante atingido" }
    }
    const id = crypto.randomUUID()
    // Nova limpeza no servidor: não confiamos que o chamador passou pelo schema do cliente.
    await db.insert(t).values({
      id,
      restaurantId,
      title: sanitizeText(input.title),
      kind: input.kind,
      body: sanitizeText(input.body),
      medium: input.medium ?? "digital",
      categoryId: input.categoryId ?? null,
    })
    const created = await find(restaurantId, id)
    return created ? { ok: true, value: toMaterial(created) } : notFound
  }

  return {
    /** Materiais ativos, ou os da lixeira com `trashed`. */
    async list(user: SessionUser, restaurantId: string, trashed = false): Promise<MkitResult<MkitMaterial[]>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      const rows = await db
        .select()
        .from(t)
        .where(and(eq(t.restaurantId, restaurantId), trashed ? isNotNull(t.deletedAt) : isNull(t.deletedAt)))
        .orderBy(desc(trashed ? t.deletedAt : t.updatedAt))
        .limit(MAX_MATERIALS_PER_RESTAURANT)
      return { ok: true, value: rows.map(toMaterial) }
    },

    async create(
      user: SessionUser,
      restaurantId: string,
      input: CreateMkitMaterial,
    ): Promise<MkitResult<MkitMaterial>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      return insertMaterial(restaurantId, input)
    },

    async update(
      user: SessionUser,
      restaurantId: string,
      id: string,
      input: UpdateMkitMaterial,
    ): Promise<MkitResult<MkitMaterial>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      if (!(await find(restaurantId, id))) return notFound
      if (input.categoryId && !(await categoryUsable(restaurantId, input.categoryId))) return badCategory
      await db
        .update(t)
        .set({
          ...(input.title !== undefined ? { title: sanitizeText(input.title) } : {}),
          ...(input.kind !== undefined ? { kind: input.kind } : {}),
          ...(input.body !== undefined ? { body: sanitizeText(input.body) } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.medium !== undefined ? { medium: input.medium } : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(t.id, id), eq(t.restaurantId, restaurantId)))
      const updated = await find(restaurantId, id)
      return updated ? { ok: true, value: toMaterial(updated) } : notFound
    },

    /** Vai para a lixeira: dá para restaurar por 30 dias (retention.ts apaga depois). */
    async remove(user: SessionUser, restaurantId: string, id: string): Promise<MkitResult<true>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      if (!(await find(restaurantId, id))) return notFound
      await db
        .update(t)
        .set({ deletedAt: new Date().toISOString() })
        .where(and(eq(t.id, id), eq(t.restaurantId, restaurantId)))
      return { ok: true, value: true }
    },

    async restore(user: SessionUser, restaurantId: string, id: string): Promise<MkitResult<MkitMaterial>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      if (!(await find(restaurantId, id, true))) return notFound
      if ((await activeCount(restaurantId)) >= MAX_MATERIALS_PER_RESTAURANT) {
        return { ok: false, code: "conflict", message: "limite de materiais do restaurante atingido" }
      }
      await db
        .update(t)
        .set({ deletedAt: null, updatedAt: new Date().toISOString() })
        .where(and(eq(t.id, id), eq(t.restaurantId, restaurantId)))
      const restored = await find(restaurantId, id)
      return restored ? { ok: true, value: toMaterial(restored) } : notFound
    },

    /** Exclusão definitiva: só vale para quem já está na lixeira. */
    async purge(user: SessionUser, restaurantId: string, id: string): Promise<MkitResult<true>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      if (await find(restaurantId, id)) {
        return { ok: false, code: "conflict", message: "envie para a lixeira antes de excluir em definitivo" }
      }
      if (!(await find(restaurantId, id, true))) return notFound
      await db.delete(t).where(and(eq(t.id, id), eq(t.restaurantId, restaurantId)))
      return { ok: true, value: true }
    },

    /** Números do painel: totais por status e tipo, exportações e os materiais mais usados (lixeira à parte). */
    async metrics(user: SessionUser, restaurantId: string): Promise<MkitResult<MkitMetrics>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      const all = await db.select().from(t).where(eq(t.restaurantId, restaurantId)).limit(MAX_MATERIALS_PER_RESTAURANT)
      const rows = all.filter((row) => row.deletedAt === null)
      const byKind = { post: 0, cartaz: 0, promocao: 0 }
      let published = 0
      let totalExports = 0
      for (const row of rows) {
        byKind[row.kind] += 1
        if (row.status === "published") published += 1
        totalExports += row.exportCount
      }
      const top = rows
        .filter((row) => row.exportCount > 0)
        .sort((a, b) => b.exportCount - a.exportCount || a.title.localeCompare(b.title))
        .slice(0, 5)
        .map((row) => ({ id: row.id, title: row.title, kind: row.kind, exportCount: row.exportCount }))
      return {
        ok: true,
        value: {
          total: rows.length,
          published,
          drafts: rows.length - published,
          trashed: all.length - rows.length,
          totalExports,
          byKind,
          top,
        },
      }
    },

    /** Texto pronto para copiar ou baixar, e a métrica de uso (cada exportação soma 1). */
    async exportText(
      user: SessionUser,
      restaurantId: string,
      id: string,
    ): Promise<MkitResult<{ filename: string; text: string }>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      const row = await find(restaurantId, id)
      if (!row) return notFound
      await db
        .update(t)
        .set({ exportCount: sql`${t.exportCount} + 1` })
        .where(eq(t.id, id))
      const slug =
        row.title
          .normalize("NFD")
          .replace(/[^\w\s-]/g, "")
          .trim()
          .toLowerCase()
          .replace(/[\s_]+/g, "-")
          .slice(0, 60) || "material"
      return { ok: true, value: { filename: `${slug}.txt`, text: `${row.title}\n\n${row.body}\n` } }
    },

    /** Categorias da plataforma e do restaurante, por nome. */
    async listCategories(user: SessionUser, restaurantId: string): Promise<MkitResult<MkitCategory[]>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      const rows = await db
        .select()
        .from(categories)
        .where(or(isNull(categories.restaurantId), eq(categories.restaurantId, restaurantId)))
        .orderBy(asc(categories.name))
      return {
        ok: true,
        value: rows.map((row) => ({
          id: row.id,
          name: row.name,
          scope: row.restaurantId === null ? "platform" : "restaurant",
        })),
      }
    },

    async createCategory(
      user: SessionUser,
      restaurantId: string,
      input: CreateMkitCategory,
    ): Promise<MkitResult<MkitCategory>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      const name = sanitizeText(input.name)
      const existing = await db
        .select({ id: categories.id, name: categories.name, restaurantId: categories.restaurantId })
        .from(categories)
        .where(or(isNull(categories.restaurantId), eq(categories.restaurantId, restaurantId)))
      if (existing.some((row) => row.name.toLowerCase() === name.toLowerCase())) {
        return { ok: false, code: "conflict", message: "já existe uma categoria com este nome" }
      }
      if (existing.filter((row) => row.restaurantId !== null).length >= MAX_CATEGORIES_PER_RESTAURANT) {
        return { ok: false, code: "conflict", message: "limite de categorias do restaurante atingido" }
      }
      const id = crypto.randomUUID()
      await db.insert(categories).values({ id, restaurantId, name })
      return { ok: true, value: { id, name, scope: "restaurant" } }
    },

    /** Só categorias do próprio restaurante; os materiais dela ficam sem categoria. */
    async removeCategory(user: SessionUser, restaurantId: string, categoryId: string): Promise<MkitResult<true>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      const [row] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1)
      if (!row || (row.restaurantId !== null && row.restaurantId !== restaurantId)) {
        return { ok: false, code: "not_found", message: "categoria não encontrada" }
      }
      if (row.restaurantId === null) {
        return { ok: false, code: "forbidden", message: "categorias da plataforma não podem ser removidas" }
      }
      await env.DB.batch([
        env.DB.prepare("update mkit_materials set category_id = null where restaurant_id = ? and category_id = ?").bind(
          restaurantId,
          categoryId,
        ),
        env.DB.prepare("delete from mkit_categories where id = ? and restaurant_id = ?").bind(categoryId, restaurantId),
      ])
      return { ok: true, value: true }
    },

    async listCalendar(user: SessionUser, restaurantId: string): Promise<MkitResult<MkitCalendarEvent[]>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      const rows = await db.select().from(events).where(eq(events.restaurantId, restaurantId)).orderBy(asc(events.date))
      return {
        ok: true,
        value: rows.map((row) => ({ id: row.id, date: row.date, name: row.name, recurring: row.recurring })),
      }
    },

    async addCalendarEvent(
      user: SessionUser,
      restaurantId: string,
      input: CreateMkitCalendarEvent,
    ): Promise<MkitResult<MkitCalendarEvent>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      const [{ total } = { total: 0 }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(events)
        .where(eq(events.restaurantId, restaurantId))
      if (total >= MAX_CALENDAR_EVENTS_PER_RESTAURANT) {
        return { ok: false, code: "conflict", message: "limite de datas do restaurante atingido" }
      }
      const created = {
        id: crypto.randomUUID(),
        date: input.date,
        name: sanitizeText(input.name),
        recurring: input.recurring ?? false,
      }
      await db.insert(events).values({ ...created, restaurantId })
      return { ok: true, value: created }
    },

    async removeCalendarEvent(user: SessionUser, restaurantId: string, eventId: string): Promise<MkitResult<true>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      const [row] = await db
        .select({ id: events.id })
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.restaurantId, restaurantId)))
        .limit(1)
      if (!row) return { ok: false, code: "not_found", message: "data não encontrada" }
      await db.delete(events).where(and(eq(events.id, eventId), eq(events.restaurantId, restaurantId)))
      return { ok: true, value: true }
    },

    /** Gera um rascunho a partir dos dados do restaurante. O produto precisa ser do restaurante. */
    async generate(
      user: SessionUser,
      restaurantId: string,
      input: GenerateMkitMaterial,
    ): Promise<MkitResult<MkitMaterial>> {
      if (!canManageRestaurant(user, restaurantId)) return forbidden
      const [restaurant] = await db
        .select({ name: schema.restaurants.name })
        .from(schema.restaurants)
        .where(eq(schema.restaurants.id, restaurantId))
        .limit(1)
      if (!restaurant) return { ok: false, code: "not_found", message: "restaurante não encontrado" }

      let product
      if (input.template !== "data") {
        if (!input.productId) return { ok: false, code: "bad_request", message: "informe o produto" }
        ;[product] = await db
          .select({
            name: schema.products.name,
            description: schema.products.description,
            priceCents: schema.products.priceCents,
            originalPriceCents: schema.products.originalPriceCents,
          })
          .from(schema.products)
          .where(and(eq(schema.products.id, input.productId), eq(schema.products.restaurantId, restaurantId)))
          .limit(1)
        if (!product) return { ok: false, code: "not_found", message: "produto não encontrado" }
      } else if (!input.eventName) {
        return { ok: false, code: "bad_request", message: "informe a data comemorativa" }
      }

      const rendered = renderTemplate(input.template, {
        restaurantName: restaurant.name,
        ...(product ? { product } : {}),
        ...(input.eventName ? { eventName: input.eventName } : {}),
        ...(input.discountPercent ? { discountPercent: input.discountPercent } : {}),
      })
      return insertMaterial(restaurantId, {
        ...rendered,
        medium: input.medium ?? "digital",
        categoryId: input.categoryId ?? null,
      })
    },
  }
}
