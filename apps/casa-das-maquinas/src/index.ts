import { API_VERSION, Id, Menu, Restaurant, SessionUser, Slug, envelope } from "@delivery/contracts"
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import { createMiddleware } from "hono/factory"
import { canManageRestaurant, createAuth, getSessionUser } from "./auth.js"
import { type AppEnv, fail, logError, ok, requestId } from "./http.js"
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

app.doc31("/v1/openapi.json", {
  openapi: "3.1.0",
  info: { title: "Casa das Máquinas", version: API_VERSION, description: "API v1 do ecossistema Delivery Express" },
})

export default app
