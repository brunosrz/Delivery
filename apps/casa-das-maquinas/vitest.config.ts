import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin"
import { defineConfig } from "vitest/config"

const fromHere = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

/** Divide o seed em comandos, ignorando comentários de linha. */
function readSeed(file: string) {
  const sql = readFileSync(fromHere(file), "utf8")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
  return sql
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean)
}

export default defineConfig(async () => {
  const migrations = await readD1Migrations(fromHere("./migrations"))
  const seed = { name: "seed/demo.sql", queries: readSeed("./seed/demo.sql") }

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: [...migrations, seed],
            // Segredo apenas de teste; produção usa `wrangler secret put`.
            BETTER_AUTH_SECRET: "test-secret-with-at-least-32-characters!!",
            GOOGLE_CLIENT_ID: "",
            GOOGLE_CLIENT_SECRET: "",
          },
        },
      }),
    ],
    test: {
      setupFiles: ["./test/apply-migrations.ts"],
    },
  }
})
