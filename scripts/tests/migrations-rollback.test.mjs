import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"
import { describe, it } from "node:test"
import { URL, fileURLToPath } from "node:url"
import { rollbackSql } from "../../apps/casa-das-maquinas/scripts/generate-rollbacks.mjs"

const app = fileURLToPath(new URL("../../apps/casa-das-maquinas/", import.meta.url))
const migrations = readdirSync(`${app}migrations`)
  .filter((name) => name.endsWith(".sql"))
  .sort()
const read = (path) => readFileSync(`${app}${path}`, "utf8")

/** Banco SQLite em memória com o ledger que o wrangler mantém (d1_migrations). */
function newDatabase() {
  const db = new DatabaseSync(":memory:")
  db.exec("PRAGMA foreign_keys = ON")
  db.exec("CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TEXT)")
  return db
}

function applyAll(db) {
  for (const name of migrations) {
    db.exec(read(`migrations/${name}`))
    db.prepare("INSERT INTO d1_migrations (name, applied_at) VALUES (?, ?)").run(name, "now")
  }
}

const userObjects = (db) =>
  db
    .prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name != 'd1_migrations' ORDER BY name")
    .all()
    .map((row) => row.name)

describe("scripts compensatórios das migrações D1", () => {
  it("estão em dia com as migrações (regenerar não muda nada)", () => {
    for (const name of migrations) {
      assert.equal(
        read(`migrations-rollback/${name}`),
        rollbackSql(name, read(`migrations/${name}`)),
        `${name}: rode node scripts/generate-rollbacks.mjs em apps/casa-das-maquinas`,
      )
    }
  })

  it("aplicar, reverter e reaplicar deixa o banco como no início", () => {
    const db = newDatabase()
    assert.deepEqual(userObjects(db), [])

    applyAll(db)
    const created = userObjects(db)
    assert.ok(created.includes("orders") && created.includes("payment_charges") && created.includes("restaurants"))

    for (const name of [...migrations].reverse()) db.exec(read(`migrations-rollback/${name}`))
    assert.deepEqual(userObjects(db), [], "o rollback deixou objetos para trás")
    assert.equal(db.prepare("SELECT count(*) AS n FROM d1_migrations").get().n, 0, "o ledger não foi limpo")

    applyAll(db)
    assert.deepEqual(userObjects(db), created)
    db.close()
  })

  it("reverter a última migração mantém as anteriores", () => {
    const db = newDatabase()
    applyAll(db)
    const last = migrations.at(-1) ?? ""
    db.exec(read(`migrations-rollback/${last}`))
    const left = userObjects(db)
    assert.ok(left.includes("orders"))
    assert.ok(!left.includes("payment_charges"))
    db.close()
  })

  it("reverte mesmo com dados nas tabelas (filhos antes dos pais)", () => {
    const db = newDatabase()
    applyAll(db)
    db.exec(
      "INSERT INTO restaurants (id, slug, name, delivery_fee_cents, minimum_order_cents, priority) VALUES ('r1','r1','R',0,0,0)",
    )
    for (const name of [...migrations].reverse()) db.exec(read(`migrations-rollback/${name}`))
    assert.deepEqual(userObjects(db), [])
    db.close()
  })
})
