import { SessionUser, envelope } from "@delivery/contracts"
import { env, exports } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { PASSWORD, call, makeStaff, postJson, sessionCookie, setRole, signUp } from "./helpers"

const me = (cookie?: string) => call("/v1/me", cookie ? { headers: { cookie } } : {})

describe("cadastro e sessão", () => {
  it("cadastra como cliente e devolve o usuário em /v1/me", async () => {
    const { cookie } = await signUp("cliente@example.test")
    const response = await me(cookie)
    expect(response.status).toBe(200)
    const { data } = envelope(SessionUser).parse(await response.json())
    expect(data).toMatchObject({ email: "cliente@example.test", role: "customer", restaurantIds: [] })
  })

  it("ignora papel enviado pelo cliente no cadastro", async () => {
    await postJson("/api/auth/sign-up/email", {
      email: "esperto@example.test",
      password: PASSWORD,
      name: "X",
      role: "admin",
    })
    const role = await env.DB.prepare("select role from user where email = ?")
      .bind("esperto@example.test")
      .first("role")
    expect(role).toBe("customer")
  })

  it("rejeita senha curta e e-mail duplicado", async () => {
    const short = await postJson("/api/auth/sign-up/email", { email: "curta@example.test", password: "123", name: "X" })
    expect(short.status).toBe(400)

    await signUp("duplicado@example.test")
    const duplicate = await postJson("/api/auth/sign-up/email", {
      email: "duplicado@example.test",
      password: PASSWORD,
      name: "X",
    })
    expect(duplicate.status).toBeGreaterThanOrEqual(400)
  })

  it("rejeita login com senha errada e aceita a correta", async () => {
    await signUp("login@example.test")
    const login = (password: string) => postJson("/api/auth/sign-in/email", { email: "login@example.test", password })
    expect((await login("errada-errada")).status).toBe(401)
    const success = await login(PASSWORD)
    expect(success.status).toBe(200)
    expect((await me(sessionCookie(success))).status).toBe(200)
  })

  it("responde 401 sem sessão, com cookie forjado ou depois do logout", async () => {
    expect((await me()).status).toBe(401)
    expect((await me("better-auth.session_token=forjado.assinatura")).status).toBe(401)

    const { cookie } = await signUp("logout@example.test")
    expect((await call("/api/auth/sign-out", { method: "POST", headers: { cookie } })).status).toBe(200)
    const after = await me(cookie)
    expect(after.status).toBe(401)
    expect(((await after.json()) as { error: { code: string } }).error.code).toBe("unauthenticated")
  })

  it("rejeita sessão expirada", async () => {
    const { userId, cookie } = await signUp("expirada@example.test")
    await env.DB.prepare("update session set expires_at = ? where user_id = ?")
      .bind(Date.now() - 1000, userId)
      .run()
    expect((await me(cookie)).status).toBe(401)
  })

  it("rejeita requisição de origem não confiável", async () => {
    const response = await exports.default.fetch(
      new Request("https://api.test/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://atacante.example" },
        body: JSON.stringify({ email: "csrf@example.test", password: PASSWORD, name: "X" }),
      }),
    )
    expect(response.status).toBe(403)
  })
})

describe("isolamento por restaurante (#14)", () => {
  const manage = (restaurantId: string, cookie?: string) =>
    call(`/v1/manage/restaurants/${restaurantId}`, cookie ? { headers: { cookie } } : {})

  it("exige sessão", async () => {
    expect((await manage("rest_pizzaria")).status).toBe(401)
  })

  it("nega acesso de cliente", async () => {
    const { cookie } = await signUp("cliente-gestao@example.test")
    expect((await manage("rest_pizzaria", cookie)).status).toBe(403)
  })

  it("equipe acessa só o próprio restaurante", async () => {
    const { userId, cookie } = await signUp("equipe-pizzaria@example.test")
    await makeStaff(userId, "rest_pizzaria")

    const own = await manage("rest_pizzaria", cookie)
    expect(own.status).toBe(200)
    expect(((await own.json()) as { data: { slug: string } }).data.slug).toBe("pizzaria-da-praca")

    expect((await manage("rest_burger", cookie)).status).toBe(403)
    expect((await manage("rest_inexistente", cookie)).status).toBe(403)
  })

  it("lista em /v1/me os restaurantes vinculados à equipe", async () => {
    const { userId, cookie } = await signUp("equipe-me@example.test")
    await makeStaff(userId, "rest_burger")
    const { data } = envelope(SessionUser).parse(await (await me(cookie)).json())
    expect(data).toMatchObject({ role: "restaurant_staff", restaurantIds: ["rest_burger"] })
  })

  it("papel de equipe sem vínculo não acessa nenhum restaurante", async () => {
    const { userId, cookie } = await signUp("equipe-sem-vinculo@example.test")
    await setRole(userId, "restaurant_staff")
    expect((await manage("rest_pizzaria", cookie)).status).toBe(403)
  })

  it("administração acessa qualquer restaurante e recebe 404 para inexistente", async () => {
    const { userId, cookie } = await signUp("admin@example.test")
    await setRole(userId, "admin")
    expect((await manage("rest_burger", cookie)).status).toBe(200)
    expect((await manage("rest_inexistente", cookie)).status).toBe(404)
  })
})
