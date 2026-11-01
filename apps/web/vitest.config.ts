import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "lib/ecosystem-status.ts",
        "lib/route-access.ts",
        "middleware.ts",
        "app/delivery-express/menu.ts",
        "lib/utils.ts",
        "lib/consent.ts",
        "lib/consent-client.ts",
        "lib/locale.ts",
        "lib/origin.ts",
        "lib/legal-client.ts",
        "lib/account-client.ts",
        "lib/legal/config.ts",
        "lib/legal/index.ts",
        "lib/legal-status.ts",
      ],
      reporter: ["text", "json-summary"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
