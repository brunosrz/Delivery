import { env, exports } from "cloudflare:workers"
import { expect } from "vitest"

export const ORIGIN = "http://localhost:3000"
export const PASSWORD = "senha-forte-123"

export const call = (path: string, init: RequestInit = {}) =>
  exports.default.fetch(
    new Request(`https://api.test${path}`, {
      ...init,
      headers: { origin: ORIGIN, ...Object.fromEntries(new Headers(init.headers).entries()) },
    }),
  )

export const postJson = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  call(path, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  })

export function sessionCookie(response: Response): string {
  const cookie = response.headers.getSetCookie().find((value) => value.includes("session_token"))
  if (!cookie) throw new Error("cookie de sessão ausente")
  return cookie.split(";")[0] ?? ""
}

export async function signUp(email: string) {
  const response = await postJson("/api/auth/sign-up/email", { email, password: PASSWORD, name: "Pessoa Teste" })
  expect(response.status).toBe(200)
  const { user } = (await response.json()) as { user: { id: string } }
  return { userId: user.id, cookie: sessionCookie(response) }
}

export const setRole = (userId: string, role: string) =>
  env.DB.prepare("update user set role = ? where id = ?").bind(role, userId).run()

export async function makeStaff(userId: string, restaurantId: string) {
  await setRole(userId, "restaurant_staff")
  await env.DB.prepare("insert into restaurant_members (user_id, restaurant_id, created_at) values (?, ?, ?)")
    .bind(userId, restaurantId, Date.now())
    .run()
}

let sequence = 0
/** Usuário novo com e-mail único dentro do arquivo de teste. */
export async function newUser(role: "customer" | "courier" | "admin" | { staffOf: string } = "customer") {
  sequence += 1
  const account = await signUp(`pessoa-${sequence}-${crypto.randomUUID().slice(0, 8)}@example.test`)
  if (typeof role === "object") await makeStaff(account.userId, role.staffOf)
  else if (role !== "customer") await setRole(account.userId, role)
  return account
}
