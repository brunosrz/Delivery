// Gera migrations-rollback/*.sql: um script compensatório por migração (o D1 não tem "down" nativo).
// Cada script remove os objetos criados pela migração (filhos antes dos pais, por causa das chaves
// estrangeiras) e apaga a linha correspondente de d1_migrations, para que a migração possa ser reaplicada.
// Uso: node scripts/generate-rollbacks.mjs
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import process from "node:process"
import { URL, fileURLToPath, pathToFileURL } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const out = `${root}migrations-rollback`
mkdirSync(out, { recursive: true })

export function objectsOf(sql) {
  const tables = [...sql.matchAll(/CREATE TABLE `([a-z_0-9]+)`/g)].map((match) => match[1])
  const indexes = [...sql.matchAll(/CREATE (?:UNIQUE )?INDEX `([a-z_0-9]+)`/g)].map((match) => match[1])
  const references = new Map(tables.map((table) => [table, new Set()]))
  for (const block of sql.split("CREATE TABLE `").slice(1)) {
    const name = block.slice(0, block.indexOf("`"))
    for (const match of block.matchAll(/REFERENCES `([a-z_0-9]+)`/g)) {
      if (match[1] !== name && references.has(match[1])) references.get(name)?.add(match[1])
    }
  }
  // Filhos antes dos pais: repete até esgotar as tabelas sem dependentes restantes.
  const remaining = new Set(tables)
  const order = []
  while (remaining.size > 0) {
    const free = [...remaining].filter(
      (table) => ![...remaining].some((other) => other !== table && references.get(other)?.has(table)),
    )
    if (free.length === 0) throw new Error("ciclo de chaves estrangeiras")
    for (const table of free) {
      order.push(table)
      remaining.delete(table)
    }
  }
  return { indexes, tables: order }
}

export function rollbackSql(file, sql) {
  const { indexes, tables } = objectsOf(sql)
  const lines = [
    `-- Reverte ${file}. Gerado por scripts/generate-rollbacks.mjs; não edite à mão.`,
    ...indexes.map((index) => `DROP INDEX IF EXISTS \`${index}\`;`),
    ...tables.map((table) => `DROP TABLE IF EXISTS \`${table}\`;`),
    `DELETE FROM d1_migrations WHERE name = '${file}';`,
  ]
  return `${lines.join("\n")}\n`
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const file of readdirSync(`${root}migrations`).filter((name) => name.endsWith(".sql"))) {
    writeFileSync(`${out}/${file}`, rollbackSql(file, readFileSync(`${root}migrations/${file}`, "utf8")))
  }
}
