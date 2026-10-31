// Falha quando um pacote do workspace importa o que não deveria. Sem dependências além do Node.
// Matriz permitida (pacotes @delivery/*):
//   domain    -> nenhum pacote do workspace
//   contracts -> domain
//   apps/*    -> contracts e domain (apps nunca importam outros apps)
// Também proíbe imports relativos que saiam da raiz do pacote e exige que todo @delivery/* importado
// esteja declarado no package.json do consumidor.

import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const ALLOWED = {
  "@delivery/domain": [],
  "@delivery/contracts": ["@delivery/domain"],
}
const APP_ALLOWED = ["@delivery/contracts", "@delivery/domain"]
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "coverage",
  "dist",
  ".wrangler",
  "test-results",
  "playwright-report",
  ".turbo",
])
const SOURCE = /\.(?:[cm]?[jt]sx?)$/
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)["']([^"']+)["']/g

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) yield* sourceFiles(path)
    else if (SOURCE.test(entry) && !entry.endsWith(".d.ts")) yield path
  }
}

function listPackages(root) {
  const found = []
  for (const group of ["apps", "packages"]) {
    const base = join(root, group)
    let names = []
    try {
      names = readdirSync(base)
    } catch {
      continue
    }
    for (const name of names) {
      const dir = join(base, name)
      try {
        const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"))
        found.push({ dir, name: manifest.name, kind: group === "apps" ? "app" : "package", manifest })
      } catch {
        // pasta sem package.json não é pacote do workspace
      }
    }
  }
  return found
}

export function checkBoundaries(root) {
  const violations = []
  for (const pkg of listPackages(root)) {
    const declared = new Set(Object.keys({ ...pkg.manifest.dependencies, ...pkg.manifest.devDependencies }))
    const allowed = pkg.kind === "app" ? APP_ALLOWED : (ALLOWED[pkg.name] ?? [])
    for (const file of sourceFiles(pkg.dir)) {
      const text = readFileSync(file, "utf8")
      for (const match of text.matchAll(IMPORT)) {
        const specifier = match[1]
        const where = `${relative(root, file).split(sep).join("/")}: ${specifier}`
        if (specifier.startsWith(".")) {
          const target = resolve(file, "..", specifier)
          if (relative(pkg.dir, target).startsWith(".."))
            violations.push(`${where} (import relativo sai da raiz de ${pkg.name})`)
        } else if (specifier.startsWith("@delivery/")) {
          const name = specifier.split("/").slice(0, 2).join("/")
          if (name === pkg.name) continue
          if (!allowed.includes(name)) violations.push(`${where} (${pkg.name} não pode importar ${name})`)
          else if (!declared.has(name)) violations.push(`${where} (${name} não está no package.json de ${pkg.name})`)
        }
      }
    }
  }
  return violations
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] ?? ".")
  const violations = checkBoundaries(root)
  if (violations.length > 0) {
    console.error(`Fronteiras de import violadas (${violations.length}):`)
    for (const violation of violations) console.error(`  - ${violation}`)
    process.exit(1)
  }
  console.log("Fronteiras de import respeitadas.")
}
