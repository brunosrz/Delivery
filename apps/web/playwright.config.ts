import { defineConfig, devices } from "@playwright/test"

const port = Number(process.env.E2E_PORT ?? 3100)
const apiPort = Number(process.env.E2E_API_PORT ?? 8787)
const apiUrl = `http://127.0.0.1:${apiPort}`

// Os testes começam com a escolha de cookies já feita (recusa), para o banner não cobrir os botões da página. O
// comportamento do banner tem spec próprio (privacy.spec.ts), que parte de um navegador sem escolha.
const consentCookie = {
  name: "consent",
  value: encodeURIComponent(
    JSON.stringify({ v: 1, id: "0b9b1d2e-3c4d-4e5f-8a6b-7c8d9e0f1a2b", a: false, m: false, t: Date.now() }),
  ),
  domain: "127.0.0.1",
  path: "/",
  expires: -1,
  httpOnly: false,
  secure: false,
  sameSite: "Lax" as const,
}

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    // Os textos dos testes são em português; o idioma segue o Accept-Language do navegador.
    locale: "pt-BR",
    trace: "retain-on-failure",
    storageState: { cookies: [consentCookie], origins: [] },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      // Casa das Máquinas real (workerd + D1 local com seed sintético).
      command: "bun run --filter @delivery/api e2e:serve",
      url: `${apiUrl}/v1/health`,
      env: { E2E_API_PORT: String(apiPort) },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: `bunx next start -p ${port}`,
      url: `http://127.0.0.1:${port}`,
      env: { CASA_DAS_MAQUINAS_URL: apiUrl },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
