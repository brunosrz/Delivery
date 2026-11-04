import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { describe, it } from "node:test"
import { URL, fileURLToPath } from "node:url"

const app = fileURLToPath(new URL("../../apps/api/", import.meta.url))
const sqlFiles = (dir) =>
  readdirSync(`${app}${dir}`)
    .filter((name) => name.endsWith(".sql"))
    .sort()
const migrations = sqlFiles("migrations")
const journal = JSON.parse(readFileSync(`${app}migrations/meta/_journal.json`, "utf8"))

describe("integridade das migrações D1", () => {
  it("numera as migrações em sequência, sem lacunas nem repetição", () => {
    migrations.forEach((name, index) => {
      assert.match(name, /^\d{4}_[a-z0-9_]+\.sql$/, `nome inválido: ${name}`)
      assert.equal(Number(name.slice(0, 4)), index, `lacuna ou repetição antes de ${name}`)
    })
  })

  it("mantém o journal do drizzle igual aos arquivos de migração", () => {
    assert.deepEqual(
      journal.entries.map((entry) => entry.tag),
      migrations.map((name) => name.replace(/\.sql$/, "")),
    )
    journal.entries.forEach((entry, index) => assert.equal(entry.idx, index))
    for (let index = 1; index < journal.entries.length; index++) {
      assert.ok(journal.entries[index].when > journal.entries[index - 1].when, "o journal deve ser cronológico")
    }
  })

  it("tem snapshot do drizzle e script de rollback para cada migração, e nenhum órfão", () => {
    for (const name of migrations) {
      const tag = name.replace(/\.sql$/, "")
      assert.ok(existsSync(`${app}migrations/meta/${tag.slice(0, 4)}_snapshot.json`), `sem snapshot de ${name}`)
      assert.ok(existsSync(`${app}migrations-rollback/${name}`), `sem rollback de ${name}`)
    }
    assert.deepEqual(sqlFiles("migrations-rollback"), migrations)
  })

  it("encadeia os snapshots (cada um aponta para o anterior)", () => {
    let previous = "00000000-0000-0000-0000-000000000000"
    for (const name of migrations) {
      const snapshot = JSON.parse(readFileSync(`${app}migrations/meta/${name.slice(0, 4)}_snapshot.json`, "utf8"))
      assert.equal(snapshot.prevId, previous, `${name} não aponta para o snapshot anterior`)
      previous = snapshot.id
    }
  })

  it("proíbe nas migrações o que o rollback compensatório não consegue desfazer", () => {
    for (const name of migrations) {
      const sql = readFileSync(`${app}migrations/${name}`, "utf8")
      assert.doesNotMatch(sql, /DROP\s+TABLE/i, `${name} apaga tabela; escreva a migração em duas etapas`)
      assert.doesNotMatch(sql, /DROP\s+COLUMN/i, `${name} apaga coluna; escreva a migração em duas etapas`)
    }
  })
})
