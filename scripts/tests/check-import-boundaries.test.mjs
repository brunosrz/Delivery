import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, beforeEach, describe, it } from "node:test"
import { checkBoundaries } from "../check-import-boundaries.mjs"

let root

function write(path, content) {
  const full = join(root, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content)
}

function pkg(path, name, dependencies = {}) {
  write(`${path}/package.json`, JSON.stringify({ name, dependencies }))
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "boundaries-"))
  pkg("packages/domain", "@delivery/domain")
  pkg("packages/contracts", "@delivery/contracts", { "@delivery/domain": "workspace:*" })
  pkg("apps/web", "@delivery/web", { "@delivery/contracts": "workspace:*", "@delivery/domain": "workspace:*" })
  pkg("apps/api", "@delivery/api", { "@delivery/contracts": "workspace:*" })
})

afterEach(() => rmSync(root, { recursive: true, force: true }))

describe("checkBoundaries", () => {
  it("aceita as dependências permitidas", () => {
    write("packages/contracts/src/a.ts", 'import { x } from "@delivery/domain"\nexport const y = x')
    write("apps/web/app/page.tsx", 'import { y } from "@delivery/contracts"\nimport "@delivery/domain"\nexport default y')
    assert.deepEqual(checkBoundaries(root), [])
  })

  it("reprova domain importando contracts", () => {
    write("packages/domain/src/a.ts", 'import { x } from "@delivery/contracts"')
    assert.match(checkBoundaries(root).join("\n"), /domain não pode importar @delivery\/contracts/)
  })

  it("reprova contracts importando um app", () => {
    write("packages/contracts/src/a.ts", 'import { x } from "@delivery/web"')
    assert.match(checkBoundaries(root).join("\n"), /contracts não pode importar @delivery\/web/)
  })

  it("reprova um app importando outro app", () => {
    write("apps/web/lib/a.ts", 'export * from "@delivery/api"')
    assert.match(checkBoundaries(root).join("\n"), /@delivery\/web não pode importar @delivery\/api/)
  })

  it("reprova import relativo que sai da raiz do pacote", () => {
    write("apps/web/lib/a.ts", 'import { x } from "../../api/src/secret"')
    assert.match(checkBoundaries(root).join("\n"), /import relativo sai da raiz de @delivery\/web/)
  })

  it("aceita import relativo dentro do pacote", () => {
    write("apps/web/lib/a.ts", 'import { x } from "../components/b"')
    assert.deepEqual(checkBoundaries(root), [])
  })

  it("reprova import de pacote permitido mas não declarado no package.json", () => {
    write("apps/api/src/a.ts", 'import { x } from "@delivery/domain"')
    assert.match(checkBoundaries(root).join("\n"), /@delivery\/domain não está no package.json de @delivery\/api/)
  })

  it("enxerga import dinâmico e require", () => {
    write("packages/domain/src/a.ts", 'const m = await import("@delivery/contracts")')
    write("packages/domain/src/b.cjs", 'const m = require("@delivery/web")')
    assert.equal(checkBoundaries(root).length, 2)
  })

  it("ignora node_modules e arquivos gerados", () => {
    write("packages/domain/node_modules/x/index.js", 'import "@delivery/contracts"')
    write("apps/web/.next/server.js", 'import "@delivery/api"')
    assert.deepEqual(checkBoundaries(root), [])
  })
})
