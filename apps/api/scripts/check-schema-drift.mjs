// Falha se o schema do Drizzle mudou sem uma migração correspondente.
// Roda `drizzle-kit generate` sobre uma cópia de migrations/ (nada é escrito no repositório);
// se o gerador criar um arquivo novo, o schema divergiu das migrações versionadas.
// Uso: node scripts/check-schema-drift.mjs
import { spawnSync } from "node:child_process"
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import process from "node:process"
import { URL, fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
// Relativo à raiz do app: o drizzle-kit junta o caminho de saída ao diretório atual (no Windows quebra com absoluto).
const relativeOut = `.wrangler/drift-${process.pid}`
const out = `${root}${relativeOut}`
const config = `${root}drizzle.drift.config.ts`

try {
  mkdirSync(`${root}.wrangler`, { recursive: true })
  cpSync(`${root}migrations`, out, { recursive: true })
  const before = readdirSync(out).length
  writeFileSync(
    config,
    `import { defineConfig } from "drizzle-kit"
export default defineConfig({
  dialect: "sqlite",
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts", "./src/db/orders-schema.ts"],
  out: ${JSON.stringify(`./${relativeOut}`)},
})
`,
  )
  const result = spawnSync(
    "bunx",
    ["drizzle-kit", "generate", "--config", "drizzle.drift.config.ts", "--name", "drift_probe"],
    {
      cwd: root,
      encoding: "utf8",
      shell: process.platform === "win32",
    },
  )
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`
  if (result.status !== 0) {
    process.stderr.write(output)
    process.exitCode = result.status ?? 1
  } else if (readdirSync(out).length !== before || !/No schema changes/i.test(output)) {
    process.stderr.write(output)
    process.stderr.write("O schema do Drizzle mudou sem migração. Rode `bun run db:generate` e versione o resultado.\n")
    process.exitCode = 1
  } else {
    process.stdout.write("Schema e migrações em dia.\n")
  }
} finally {
  rmSync(config, { force: true })
  rmSync(out, { recursive: true, force: true })
}
