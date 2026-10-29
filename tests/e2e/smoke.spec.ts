import { expect, test } from "@playwright/test"
import { ECOSYSTEM_PRODUCTS } from "../../lib/ecosystem-status"

test("a página inicial lista todos os produtos com o estado real", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1, name: "Ecossistema Delivery Express" })).toBeVisible()
  for (const product of ECOSYSTEM_PRODUCTS) {
    await expect(page.getByRole("link", { name: `Abrir ${product.name}` })).toHaveAttribute("href", product.route)
  }
})

for (const product of ECOSYSTEM_PRODUCTS) {
  test(`${product.name} responde sem erro de servidor`, async ({ page }) => {
    const response = await page.goto(product.route)
    expect(response?.status()).toBeLessThan(500)
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible()
  })
}

test("o Delivery Express informa quando o catálogo está indisponível", async ({ page }) => {
  test.skip(Boolean(process.env.E2E_SUPABASE_LIVE), "com Supabase real o catálogo deve carregar")
  await page.goto("/delivery-express")
  await expect(page.getByRole("alert")).toContainText("Catálogo indisponível")
})

test("rotas inexistentes respondem 404", async ({ page }) => {
  const response = await page.goto("/delivery-express/rota-que-nao-existe/xyz")
  expect(response?.status()).toBe(404)
})

test("rotas protegidas redirecionam para o login preservando o destino", async ({ page }) => {
  await page.goto("/pedidos-na-mao")
  await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=/)
})
