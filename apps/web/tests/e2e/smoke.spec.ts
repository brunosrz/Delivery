import { expect, test } from "@playwright/test"
import { ECOSYSTEM_PRODUCTS } from "../../lib/ecosystem-status"
import { isProtectedRoute } from "../../lib/route-access"

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
    if (isProtectedRoute(product.route)) {
      await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=/)
      await expect(page.getByRole("heading", { level: 1, name: "Entrar" })).toBeVisible()
    } else {
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible()
    }
  })
}

test.describe("jornada do catálogo contra a Casa das Máquinas", () => {
  test("lista os restaurantes vindos da API", async ({ page }) => {
    await page.goto("/delivery-express")
    await expect(page.getByRole("heading", { level: 2, name: "Pizzaria da Praça" })).toBeVisible()
    await expect(page.getByRole("heading", { level: 2, name: "Burger do Bairro" })).toBeVisible()
    await expect(page.getByText("Entrega R$ 7,90")).toBeVisible()
  })

  test("abre o cardápio e o produto com adicionais", async ({ page }) => {
    await page.goto("/delivery-express")
    await page.getByRole("link", { name: /Burger do Bairro/ }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Burger do Bairro" })).toBeVisible()
    await expect(page.getByRole("heading", { level: 2, name: "Hambúrgueres" })).toBeVisible()

    await page.getByRole("link", { name: /Burger clássico/ }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Burger clássico" })).toBeVisible()
    await expect(page.getByText("R$ 32,90")).toBeVisible()
    const ponto = page.getByRole("group", { name: "Ponto da carne" })
    await expect(ponto).toContainText("Obrigatório, escolha 1")
    await expect(ponto.getByRole("radio")).toHaveCount(2)
    await expect(page.getByRole("group", { name: "Adicionais" }).getByRole("checkbox")).toHaveCount(2)
    await expect(page.getByRole("button", { name: "Adicionar à sacola" })).toBeDisabled()
  })

  test("restaurante e produto inexistentes respondem 404", async ({ page }) => {
    expect((await page.goto("/delivery-express/restaurant/nao-existe"))?.status()).toBe(404)
    expect((await page.goto("/delivery-express/restaurant/pizzaria-da-praca/product/nao-existe"))?.status()).toBe(404)
  })
})

test("rotas inexistentes respondem 404", async ({ page }) => {
  const response = await page.goto("/delivery-express/rota-que-nao-existe/xyz")
  expect(response?.status()).toBe(404)
})

test("rotas protegidas redirecionam para o login preservando o destino", async ({ page }) => {
  await page.goto("/pedidos-na-mao")
  await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=/)
})
