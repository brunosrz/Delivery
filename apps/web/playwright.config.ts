import { defineConfig, devices } from "@playwright/test"

const port = Number(process.env.E2E_PORT ?? 3100)
const apiPort = Number(process.env.E2E_API_PORT ?? 8787)
const apiUrl = `http://127.0.0.1:${apiPort}`

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      // Casa das Máquinas real (workerd + D1 local com seed sintético).
      command: "pnpm --filter @delivery/casa-das-maquinas e2e:serve",
      url: `${apiUrl}/v1/health`,
      env: { E2E_API_PORT: String(apiPort) },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: `pnpm exec next start -p ${port}`,
      url: `http://127.0.0.1:${port}`,
      env: { CASA_DAS_MAQUINAS_URL: apiUrl },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
