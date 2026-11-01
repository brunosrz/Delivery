// Hooks do Node para carregar o Worker fora do workerd (só para exportar o OpenAPI):
// - "cloudflare:workers" vira um stub;
// - imports ESM com ".js" que apontam para fontes ".ts" são resolvidos para o ".ts".
import { existsSync } from "node:fs"
import { URL, fileURLToPath } from "node:url"

const STUB =
  "data:text/javascript,export class DurableObject { constructor(state, env) { this.ctx = state; this.env = env } }"

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") return { url: STUB, shortCircuit: true }
  if (specifier.startsWith(".") && specifier.endsWith(".js") && context.parentURL) {
    const target = new URL(specifier, context.parentURL)
    if (!existsSync(fileURLToPath(target))) {
      const ts = new URL(specifier.replace(/\.js$/, ".ts"), context.parentURL)
      if (existsSync(fileURLToPath(ts))) return { url: ts.href, shortCircuit: true }
    }
  }
  return nextResolve(specifier, context)
}
