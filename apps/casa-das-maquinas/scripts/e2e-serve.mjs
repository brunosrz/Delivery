// Sobe a API para os testes E2E com um D1 local descartável: migrações + seed sintético.
import process from "node:process"
import { execFileSync, spawn } from "node:child_process"
import { rmSync } from "node:fs"

const persist = ".wrangler/e2e"
const port = process.env.E2E_API_PORT ?? "8787"
const wrangler = (args, options = {}) => [process.platform === "win32" ? "wrangler.cmd" : "wrangler", args, options]

rmSync(persist, { recursive: true, force: true })
const run = (args) => {
  const [command, argv] = wrangler(args)
  execFileSync(command, argv, { stdio: "inherit", shell: process.platform === "win32" })
}
run(["d1", "migrations", "apply", "DB", "--local", "--persist-to", persist])
run(["d1", "execute", "DB", "--local", "--persist-to", persist, "--file", "seed/demo.sql"])

const [command, argv] = wrangler(["dev", "--ip", "127.0.0.1", "--port", port, "--persist-to", persist])
const server = spawn(command, argv, { stdio: "inherit", shell: process.platform === "win32" })
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal))
server.on("exit", (code) => process.exit(code ?? 0))
