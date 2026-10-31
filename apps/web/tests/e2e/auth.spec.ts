import { expect, test } from "@playwright/test"

// Cada execução cria um e-mail único: o D1 do E2E é descartável, mas os projetos rodam em paralelo.
const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`

test.describe("conta pela Casa das Máquinas", () => {
  test("cadastra, mantém a sessão, barra papel errado e sai", async ({ page }) => {
    await page.goto("/auth/register?callbackUrl=%2Fdelivery-express")
    await expect(page.getByRole("heading", { level: 1, name: "Criar conta" })).toBeVisible()

    await page.getByLabel("Nome").fill("Cliente E2E")
    await page.getByLabel("E-mail").fill(uniqueEmail("cliente"))
    await page.getByLabel("Senha", { exact: true }).fill("senha-forte-123")
    await page.getByLabel("Confirmar senha").fill("senha-forte-123")
    await page.getByRole("button", { name: "Criar conta" }).click()

    await expect(page).toHaveURL(/\/delivery-express$/)
    await expect(page.getByRole("button", { name: "Conta de Cliente E2E" })).toBeVisible()

    // Cliente autenticado não acessa o painel do restaurante.
    await page.goto("/pedidos-na-mao")
    await expect(page.getByRole("alert").filter({ hasText: "Acesso restrito" })).toBeVisible()

    await page.goto("/delivery-express")
    await page.getByRole("button", { name: "Conta de Cliente E2E" }).click()
    await page.getByRole("menuitem", { name: "Sair" }).click()
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible()

    await page.goto("/pedidos-na-mao")
    await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=/)
  })

  test("mostra erro acessível para senha errada", async ({ page }) => {
    await page.goto("/auth/login")
    await page.getByLabel("E-mail").fill(uniqueEmail("inexistente"))
    await page.getByLabel("Senha").fill("senha-errada-123")
    await page.getByRole("button", { name: "Entrar" }).click()
    await expect(page.getByRole("alert").filter({ hasText: "E-mail ou senha incorretos." })).toBeVisible()
  })

  test("valida a confirmação de senha antes de chamar o backend", async ({ page }) => {
    await page.goto("/auth/register")
    await page.getByLabel("Nome").fill("X")
    await page.getByLabel("E-mail").fill(uniqueEmail("confirmacao"))
    await page.getByLabel("Senha", { exact: true }).fill("senha-forte-123")
    await page.getByLabel("Confirmar senha").fill("outra-senha-123")
    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(page.getByRole("alert").filter({ hasText: "As senhas não coincidem." })).toBeVisible()
  })
})
