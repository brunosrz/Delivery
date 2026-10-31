// Gera o snapshot do OpenAPI em packages/contracts/openapi/v1.json, sem subir o workerd.
// Uso: pnpm --filter @delivery/casa-das-maquinas openapi:export   (Node 22.18+ ou 24+)
import { mkdirSync, writeFileSync } from "node:fs"
import { register } from "node:module"
import { dirname } from "node:path"
import process from "node:process"
import { URL, fileURLToPath, pathToFileURL } from "node:url"

register("./openapi-loader.mjs", pathToFileURL(fileURLToPath(import.meta.url)))

const { default: app } = await import("../src/index.ts")
const response = await app.request("/v1/openapi.json")
if (!response.ok) {
  process.stderr.write(`Falha ao gerar o OpenAPI: HTTP ${response.status}\n`)
  process.exit(1)
}
const document = await response.json()
const target = fileURLToPath(new URL("../../../packages/contracts/openapi/v1.json", import.meta.url))
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`)
process.stdout.write(
  `OpenAPI v1 gravado em packages/contracts/openapi/v1.json (${Object.keys(document.paths).length} rotas)\n`,
)
