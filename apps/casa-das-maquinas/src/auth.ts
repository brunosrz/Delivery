import type { Role, SessionUser } from "@delivery/contracts"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"
import * as authSchema from "./db/auth-schema.js"

/**
 * Instância do Better Auth por requisição: os bindings (D1, segredos) só
 * existem dentro do handler, e nenhum estado de requisição fica em escopo de módulo.
 */
export function createAuth(env: Env) {
  const db = drizzle(env.DB, { schema: authSchema })
  const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    trustedOrigins: env.TRUSTED_ORIGINS.split(",").map((origin) => origin.trim()),
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: authSchema.user,
        session: authSchema.session,
        account: authSchema.account,
        verification: authSchema.verification,
      },
    }),
    emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128 },
    // O papel nunca vem do cliente: todo cadastro nasce como cliente.
    user: { additionalFields: { role: { type: "string", input: false, defaultValue: "customer" } } },
    ...(googleConfigured
      ? { socialProviders: { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } } }
      : {}),
    advanced: { database: { generateId: () => crypto.randomUUID() } },
  })
}

const ROLES: readonly Role[] = ["customer", "restaurant_staff", "courier", "admin"]

function asRole(value: unknown): Role {
  return ROLES.includes(value as Role) ? (value as Role) : "customer"
}

/** Resolve o usuário da sessão (cookie ou bearer) com os restaurantes em que ele atua. */
export async function getSessionUser(env: Env, headers: Headers): Promise<SessionUser | null> {
  const session = await createAuth(env).api.getSession({ headers })
  if (!session) return null

  const db = drizzle(env.DB, { schema: authSchema })
  const memberships = await db
    .select({ restaurantId: authSchema.restaurantMembers.restaurantId })
    .from(authSchema.restaurantMembers)
    .where(eq(authSchema.restaurantMembers.userId, session.user.id))

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: asRole((session.user as { role?: unknown }).role),
    restaurantIds: memberships.map((membership) => membership.restaurantId),
  }
}

/** Equipe do restaurante ou administração: a única regra de acesso a dados de gestão de um tenant. */
export function canManageRestaurant(user: SessionUser, restaurantId: string): boolean {
  if (user.role === "admin") return true
  return user.role === "restaurant_staff" && user.restaurantIds.includes(restaurantId)
}
