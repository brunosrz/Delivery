import { expect, test } from "@playwright/test"

// Aqui o navegador começa sem nenhuma escolha de cookies (ao contrário dos demais specs).
test.use({ storageState: { cookies: [], origins: [] } })

const consentCookie = async (page: import("@playwright/test").Page) =>
  (await page.context().cookies()).find((cookie) => cookie.name === "consent")

test.describe("cookies e privacidade", () => {
  test("o banner aparece, recusar é tão fácil quanto aceitar e a escolha fica gravada", async ({ page }) => {
    await page.goto("/")
    const banner = page.getByRole("region", { name: "Aviso de cookies" })
    await expect(banner).toBeVisible()
    // Nada opcional está ligado antes da escolha.
    expect(await consentCookie(page)).toBeUndefined()

    const reject = banner.getByRole("button", { name: "Rejeitar tudo" })
    const accept = banner.getByRole("button", { name: "Aceitar tudo" })
    const [rejectBox, acceptBox] = [await reject.boundingBox(), await accept.boundingBox()]
    expect(rejectBox?.height).toBe(acceptBox?.height)

    await reject.click()
    await expect(banner).toBeHidden()
    const saved = await consentCookie(page)
    expect(saved).toBeDefined()
    expect(JSON.parse(decodeURIComponent(saved?.value ?? "{}"))).toMatchObject({ v: 1, a: false, m: false })

    // A escolha vale nas próximas visitas: o banner não volta.
    await page.reload()
    await expect(page.getByRole("region", { name: "Aviso de cookies" })).toBeHidden()
  })

  test("dá para mudar a escolha depois, pelo rodapé", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Rejeitar tudo" }).click()

    await page.getByRole("button", { name: "Preferências de cookies" }).click()
    const dialog = page.getByRole("dialog", { name: "Preferências de cookies" })
    await expect(dialog).toBeVisible()
    await dialog.getByRole("checkbox", { name: /Estatística/ }).check()
    await dialog.getByRole("button", { name: "Salvar escolhas" }).click()
    await expect(dialog).toBeHidden()

    const saved = await consentCookie(page)
    expect(JSON.parse(decodeURIComponent(saved?.value ?? "{}"))).toMatchObject({ a: true, m: false })
  })

  test("o sinal Global Privacy Control vale como recusa, sem banner", async ({ browser }) => {
    const context = await browser.newContext({ extraHTTPHeaders: { "sec-gpc": "1" } })
    await context.addInitScript(() => Object.defineProperty(navigator, "globalPrivacyControl", { value: true }))
    const page = await context.newPage()
    await page.goto("http://127.0.0.1:" + (process.env.E2E_PORT ?? 3100) + "/")
    await expect(page.getByRole("region", { name: "Aviso de cookies" })).toBeHidden()
    await expect.poll(async () => (await consentCookie(page))?.value).toBeTruthy()
    expect(JSON.parse(decodeURIComponent((await consentCookie(page))?.value ?? "{}"))).toMatchObject({
      a: false,
      m: false,
    })
    await context.close()
  })

  test("termos, privacidade e cookies abrem, e o idioma muda pelo rodapé", async ({ page }) => {
    await page.goto("/legal/privacidade")
    await expect(page.getByRole("heading", { level: 1, name: "Política de Privacidade" })).toBeVisible()
    await expect(page.getByRole("heading", { name: /Se você está nos Estados Unidos/ })).toBeVisible()
    await page.getByRole("button", { name: "Rejeitar tudo" }).click()

    await page.getByLabel("Idioma").selectOption("en")
    await expect(page.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeVisible()
    await expect(page.locator("html")).toHaveAttribute("lang", "en")

    await page.goto("/legal/termos")
    await expect(page.getByRole("heading", { level: 1, name: "Terms of Use" })).toBeVisible()
    await page.goto("/legal/cookies")
    await expect(page.getByRole("heading", { level: 1, name: "Cookie Policy" })).toBeVisible()
    await expect(page.getByRole("cell", { name: "PARAGLIDE_LOCALE" })).toBeVisible()

    const unknown = await page.goto("/legal/inexistente")
    expect(unknown?.status()).toBe(404)
  })

  test("o cadastro exige aceitar os termos e declarar maioridade", async ({ page }) => {
    await page.goto("/auth/register")
    await page.getByRole("button", { name: "Rejeitar tudo" }).click()
    const terms = page.getByLabel(/Li e aceito/)
    const adult = page.getByLabel("Declaro ter 18 anos ou mais.")
    await expect(terms).not.toBeChecked()
    await expect(adult).not.toBeChecked()
    await expect(terms).toHaveAttribute("required", "")
    await expect(adult).toHaveAttribute("required", "")
  })

  test("as páginas trazem cabeçalhos de segurança", async ({ request }) => {
    const response = await request.get("/legal/termos")
    const headers = response.headers()
    expect(headers["x-frame-options"]).toBe("DENY")
    expect(headers["x-content-type-options"]).toBe("nosniff")
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'")
    expect(headers["strict-transport-security"]).toContain("max-age=")
  })
})
