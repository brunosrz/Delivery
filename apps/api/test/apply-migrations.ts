import { applyD1Migrations } from "cloudflare:test"
import { env } from "cloudflare:workers"

// Cada arquivo de teste recebe um D1 isolado: aplica o schema versionado e o seed sintético.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
