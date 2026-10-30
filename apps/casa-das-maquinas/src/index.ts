import {
  API_VERSION,
  CreateOrderRequest,
  Id,
  IdempotencyKey,
  Menu,
  Order,
  Quote,
  QuoteRequest,
  Restaurant,
  SessionUser,
  Slug,
  StatusTransitionRequest,
  envelope,
} from "@delivery/contracts"
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import { createMiddleware } from "hono/factory"
import { canManageRestaurant, createAuth, getSessionUser } from "./auth.js"
import { type AppEnv, created, fail, logError, ok, requestId } from "./http.js"
import { type LiveScope, signTicket, verifyTicket } from "./live-ticket.js"
import { createOrdersService } from "./orders.js"
import type { LiveEvent } from "./restaurant-room.js"

export { RestaurantRoom } from "./restaurant-room.js"

/** Publica no objeto do restaurante; falha de tempo real nunca desfaz o pedido já gravado. */
async function publishOrderEvent(
  env: Env,
  type: LiveEvent["type"],
  order: { id: string; restaurantId: string; status: string; updatedAt: string },
) {
  try {
    await env.RESTAURANT_ROOM.getByName(order.restaurantId).publish({
      type,
      orderId: order.id,
      status: order.status,
      at: order.updatedAt,
    })
  } catch (error) {
    console.error(
      JSON.stringify({ level: "error", event: "live_publish_failed", orderId: order.id, message: String(error) }),
    )
  }
}
import { createCatalogRepository } from "./repositories/catalog.js"

const app = new OpenAPIHono<AppEnv>({
  // Erros de validação viram o envelope padrão em vez da resposta crua do zod.
  defaultHook: (result, c) => {
    if (!result.success) {
      const fields: Record<string, string[]> = {}
      for (const issue of result.error.issues) {
        const path = issue.path.join(".") || "_"
        ;(fields[path] ??= []).push(issue.message)
      }
      return fail(c, "bad_request", "requisição inválida", fields)
    }
    return undefined
  },
})

app.use("*", requestId)
// Leituras públicas do catálogo aceitam qualquer origem; rotas com sessão passam pelo proxy do app web.
app.use(
  "/v1/restaurants/*",
  cors({ origin: "*", allowHeaders: ["Content-Type", "X-Request-Id"], exposeHeaders: ["X-Request-Id"] }),
)
app.use(
  "/v1/restaurants",
  cors({ origin: "*", allowHeaders: ["Content-Type", "X-Request-Id"], exposeHeaders: ["X-Request-Id"] }),
)

// Login, cadastro e sessão do Better Auth. O app web repassa /api/auth/* para cá (mesmo site, cookie first-party).
app.on(["GET", "POST"], "/api/auth/*", (c) => createAuth(c.env).handler(c.req.raw))

const withSession = createMiddleware<AppEnv>(async (c, next) => {
  c.set("user", await getSessionUser(c.env, c.req.raw.headers))
  await next()
})
app.use("/v1/me", withSession)
app.use("/v1/manage/*", withSession)
app.use("/v1/orders", withSession)
app.use("/v1/orders/*", withSession)
app.use("/v1/live/tickets", withSession)

app.onError((error, c) => {
  logError(c, "unhandled_error", error)
  return fail(c, "internal", "erro interno")
})

app.notFound((c) => fail(c, "not_found", "rota não encontrada"))

const errorResponse = { content: { "application/json": { schema: envelope(z.null()) } }, description: "Erro" }

app.openapi(
  createRoute({
    method: "get",
    path: "/v1/health",
    responses: {
      200: {
        content: { "application/json": { schema: envelope(z.object({ status: z.literal("ok") })) } },
        description: "Worker ativo e banco acessível",
      },
      503: errorResponse,
    },
  }),
  async (c) => {
    try {
      await c.env.DB.prepare("select 1").first()
      return ok(c, { status: "ok" as const })
    } catch (error) {
      logError(c, "health_db_unavailable", error)
      return fail(c, "unavailable", "banco indisponível")
    }
  },
)

app.openapi(
  createRoute({
    method: "get",
    path: "/v1/restaurants",
    responses: {
      200: {
        content: { "application/json": { schema: envelope(z.array(Restaurant)) } },
        description: "Restaurantes ordenados por prioridade",
      },
    },
  }),
  async (c) => ok(c, await createCatalogRepository(c.env.DB).listRestaurants()),
)

app.openapi(
  createRoute({
    method: "get",
    path: "/v1/restaurants/{slug}/menu",
    request: { params: z.object({ slug: Slug }) },
    responses: {
      200: { content: { "application/json": { schema: envelope(Menu) } }, description: "Cardápio completo" },
      400: errorResponse,
      404: errorResponse,
    },
  }),
  async (c) => {
    const { slug } = c.req.valid("param")
    const menu = await createCatalogRepository(c.env.DB).getMenuBySlug(slug)
    if (!menu) return fail(c, "not_found", "restaurante não encontrado")
    return ok(c, menu)
  },
)

app.openapi(
  createRoute({
    method: "get",
    path: "/v1/me",
    responses: {
      200: { content: { "application/json": { schema: envelope(SessionUser) } }, description: "Usuário da sessão" },
      401: errorResponse,
    },
  }),
  (c) => {
    const user = c.get("user")
    if (!user) return fail(c, "unauthenticated", "sessão ausente ou expirada")
    return ok(c, user)
  },
)

app.openapi(
  createRoute({
    method: "get",
    path: "/v1/manage/restaurants/{restaurantId}",
    request: { params: z.object({ restaurantId: Id }) },
    responses: {
      200: { content: { "application/json": { schema: envelope(Restaurant) } }, description: "Restaurante gerido" },
      401: errorResponse,
      403: errorResponse,
      404: errorResponse,
    },
  }),
  async (c) => {
    const user = c.get("user")
    if (!user) return fail(c, "unauthenticated", "sessão ausente ou expirada")
    const { restaurantId } = c.req.valid("param")
    // Autoriza antes de consultar: quem não gere o restaurante não descobre se ele existe.
    if (!canManageRestaurant(user, restaurantId)) return fail(c, "forbidden", "sem acesso a este restaurante")
    const restaurant = await createCatalogRepository(c.env.DB).getRestaurantById(restaurantId)
    if (!restaurant) return fail(c, "not_found", "restaurante não encontrado")
    return ok(c, restaurant)
  },
)

const json = <T extends z.ZodType>(schema: T) => ({ content: { "application/json": { schema } }, required: true })

app.openapi(
  createRoute({
    method: "post",
    path: "/v1/quotes",
    request: { body: json(QuoteRequest) },
    responses: {
      200: {
        content: { "application/json": { schema: envelope(Quote) } },
        description: "Cotação calculada no servidor",
      },
      400: errorResponse,
      404: errorResponse,
    },
  }),
  async (c) => {
    const result = await createOrdersService(c.env).quote(c.req.valid("json"))
    if (!result.ok)
      return fail(c, result.error.code as "bad_request" | "not_found", result.error.message, result.error.fields)
    return ok(c, result.value)
  },
)

app.openapi(
  createRoute({
    method: "post",
    path: "/v1/orders",
    request: { headers: z.object({ "idempotency-key": IdempotencyKey }), body: json(CreateOrderRequest) },
    responses: {
      201: { content: { "application/json": { schema: envelope(Order) } }, description: "Pedido criado" },
      200: { content: { "application/json": { schema: envelope(Order) } }, description: "Repetição idempotente" },
      400: errorResponse,
      401: errorResponse,
      404: errorResponse,
      409: errorResponse,
      422: errorResponse,
    },
  }),
  async (c) => {
    const user = c.get("user")
    if (!user) return fail(c, "unauthenticated", "sessão ausente ou expirada")
    const key = c.req.valid("header")["idempotency-key"]
    const result = await createOrdersService(c.env).create(user, key, c.req.valid("json"))
    if (!result.ok) {
      const code = result.error.code as "bad_request" | "not_found" | "conflict" | "idempotency_mismatch"
      return fail(c, code, result.error.message, result.error.fields)
    }
    c.header("idempotent-replayed", String(result.value.replayed))
    if (result.value.replayed) return ok(c, result.value.order)
    await publishOrderEvent(c.env, "order.created", result.value.order)
    return created(c, result.value.order)
  },
)

app.openapi(
  createRoute({
    method: "get",
    path: "/v1/orders",
    responses: {
      200: { content: { "application/json": { schema: envelope(z.array(Order)) } }, description: "Pedidos do cliente" },
      401: errorResponse,
    },
  }),
  async (c) => {
    const user = c.get("user")
    if (!user) return fail(c, "unauthenticated", "sessão ausente ou expirada")
    return ok(c, await createOrdersService(c.env).listForCustomer(user))
  },
)

app.openapi(
  createRoute({
    method: "get",
    path: "/v1/orders/{orderId}",
    request: { params: z.object({ orderId: Id }) },
    responses: {
      200: { content: { "application/json": { schema: envelope(Order) } }, description: "Pedido" },
      401: errorResponse,
      404: errorResponse,
    },
  }),
  async (c) => {
    const user = c.get("user")
    if (!user) return fail(c, "unauthenticated", "sessão ausente ou expirada")
    const result = await createOrdersService(c.env).get(user, c.req.valid("param").orderId)
    if (!result.ok) return fail(c, "not_found", result.error.message)
    return ok(c, result.value)
  },
)

app.openapi(
  createRoute({
    method: "post",
    path: "/v1/orders/{orderId}/transitions",
    request: { params: z.object({ orderId: Id }), body: json(StatusTransitionRequest) },
    responses: {
      200: { content: { "application/json": { schema: envelope(Order) } }, description: "Status atualizado" },
      401: errorResponse,
      403: errorResponse,
      404: errorResponse,
      409: errorResponse,
    },
  }),
  async (c) => {
    const user = c.get("user")
    if (!user) return fail(c, "unauthenticated", "sessão ausente ou expirada")
    const result = await createOrdersService(c.env).transition(user, c.req.valid("param").orderId, c.req.valid("json"))
    if (!result.ok) {
      const code = result.error.code as "not_found" | "forbidden" | "invalid_transition"
      return fail(c, code, result.error.message)
    }
    await publishOrderEvent(c.env, "order.updated", result.value)
    return ok(c, result.value)
  },
)

app.openapi(
  createRoute({
    method: "get",
    path: "/v1/manage/restaurants/{restaurantId}/orders",
    request: { params: z.object({ restaurantId: Id }) },
    responses: {
      200: {
        content: { "application/json": { schema: envelope(z.array(Order)) } },
        description: "Fila do restaurante",
      },
      401: errorResponse,
      403: errorResponse,
    },
  }),
  async (c) => {
    const user = c.get("user")
    if (!user) return fail(c, "unauthenticated", "sessão ausente ou expirada")
    const { restaurantId } = c.req.valid("param")
    if (!canManageRestaurant(user, restaurantId)) return fail(c, "forbidden", "sem acesso a este restaurante")
    return ok(c, await createOrdersService(c.env).listForRestaurant(restaurantId))
  },
)

const LiveTicketRequest = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("restaurant"), restaurantId: Id }).strict(),
  z.object({ scope: z.literal("order"), orderId: Id }).strict(),
])

app.openapi(
  createRoute({
    method: "post",
    path: "/v1/live/tickets",
    request: { body: json(LiveTicketRequest) },
    responses: {
      200: {
        content: { "application/json": { schema: envelope(z.object({ ticket: z.string(), expiresIn: z.number() })) } },
        description: "Ticket de 60 s para abrir o WebSocket",
      },
      401: errorResponse,
      403: errorResponse,
      404: errorResponse,
    },
  }),
  async (c) => {
    const user = c.get("user")
    if (!user) return fail(c, "unauthenticated", "sessão ausente ou expirada")
    const body = c.req.valid("json")

    let scope: LiveScope
    if (body.scope === "restaurant") {
      if (!canManageRestaurant(user, body.restaurantId)) return fail(c, "forbidden", "sem acesso a este restaurante")
      scope = { scope: "restaurant", restaurantId: body.restaurantId }
    } else {
      const order = await createOrdersService(c.env).get(user, body.orderId)
      if (!order.ok) return fail(c, "not_found", "pedido não encontrado")
      scope = { scope: "order", restaurantId: order.value.restaurantId, orderId: order.value.id }
    }

    const ticket = await signTicket(c.env.BETTER_AUTH_SECRET, { ...scope, sub: user.id })
    return ok(c, { ticket, expiresIn: 60 })
  },
)

// Upgrade para WebSocket: valida o ticket e repassa ao objeto do restaurante.
app.get("/v1/live", async (c) => {
  if (c.req.header("upgrade") !== "websocket") return fail(c, "bad_request", "use WebSocket")
  const ticket = await verifyTicket(c.env.BETTER_AUTH_SECRET, c.req.query("ticket") ?? "")
  if (!ticket) return fail(c, "unauthenticated", "ticket inválido ou expirado")

  const headers = new Headers({ upgrade: "websocket" })
  if (ticket.scope === "order") headers.set("x-live-order", ticket.orderId)
  headers.set("x-live-sub", ticket.sub)
  headers.set("x-live-restaurant", ticket.restaurantId)
  const since = c.req.query("since")
  if (since && /^\d{1,15}$/.test(since)) headers.set("x-live-since", since)

  return c.env.RESTAURANT_ROOM.getByName(ticket.restaurantId).fetch(new Request("https://room/connect", { headers }))
})

app.doc31("/v1/openapi.json", {
  openapi: "3.1.0",
  info: { title: "Casa das Máquinas", version: API_VERSION, description: "API v1 do ecossistema Delivery Express" },
})

export default app
