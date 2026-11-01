import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { describe, expect, it, vi } from "vitest"
import { buildManifest, manifestUrl } from "@/lib/pwa"
import { isProtectedRoute } from "@/lib/route-access"

describe("manifesto dos apps instaláveis", () => {
  it.each(["pedidos-na-mao", "ta-na-entrega"] as const)("%s: escopo, início e ícones válidos", (app) => {
    const manifest = buildManifest(app)
    expect(manifest.start_url).toBe(`/${app}`)
    expect(manifest.scope).toBe(`/${app}/`)
    expect(manifest.display).toBe("standalone")
    const sizes = manifest.icons?.map((icon) => icon.sizes)
    expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]))
    expect(manifest.icons?.some((icon) => icon.purpose === "maskable")).toBe(true)
    for (const icon of manifest.icons ?? []) {
      expect(() => readFileSync(`public${icon.src}`)).not.toThrow()
    }
  })

  it("o manifesto fica fora das rotas protegidas (o navegador o busca sem sessão)", () => {
    for (const app of ["pedidos-na-mao", "ta-na-entrega"] as const) {
      expect(isProtectedRoute(manifestUrl(app))).toBe(false)
    }
    expect(isProtectedRoute("/sw.js")).toBe(false)
    expect(isProtectedRoute("/offline.html")).toBe(false)
  })
})

type Listener = (event: Record<string, unknown>) => void

function loadWorker(caches: unknown, fetchImpl: unknown) {
  const listeners = new Map<string, Listener>()
  const self = {
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  }
  runInNewContext(readFileSync("public/sw.js", "utf8"), { self, caches, fetch: fetchImpl, URL })
  return listeners
}

const request = (url: string, init: { method?: string; mode?: string } = {}) => ({
  url: `https://app.test${url}`,
  method: init.method ?? "GET",
  mode: init.mode ?? "navigate",
})

describe("service worker", () => {
  const offline = { offline: true }
  const caches = { match: vi.fn(async () => offline), open: vi.fn(), keys: vi.fn(), delete: vi.fn() }

  it("devolve a página offline quando a navegação falha", async () => {
    const worker = loadWorker(caches, vi.fn().mockRejectedValue(new TypeError("offline")))
    const respondWith = vi.fn()
    worker.get("fetch")?.({ request: request("/pedidos-na-mao"), respondWith })
    expect(respondWith).toHaveBeenCalledOnce()
    await expect(respondWith.mock.calls[0]?.[0]).resolves.toBe(offline)
  })

  it("não intercepta a API, métodos não GET nem requisições que não são navegação", () => {
    const worker = loadWorker(caches, vi.fn())
    for (const req of [
      request("/api/v1/orders"),
      request("/pedidos-na-mao", { method: "POST" }),
      request("/_next/static/app.js", { mode: "no-cors" }),
    ]) {
      const respondWith = vi.fn()
      worker.get("fetch")?.({ request: req, respondWith })
      expect(respondWith).not.toHaveBeenCalled()
    }
  })

  it("só guarda a página offline e apaga caches antigos na ativação", async () => {
    const add = vi.fn(async () => undefined)
    const store = {
      match: vi.fn(),
      open: vi.fn(async () => ({ add })),
      keys: vi.fn(async () => ["delivery-shell-v1", "antigo"]),
      delete: vi.fn(async () => true),
    }
    const worker = loadWorker(store, vi.fn())

    let installed: Promise<unknown> = Promise.resolve()
    worker.get("install")?.({ waitUntil: (promise: Promise<unknown>) => (installed = promise) })
    await installed
    expect(add).toHaveBeenCalledTimes(1)
    expect(add).toHaveBeenCalledWith("/offline.html")

    let activated: Promise<unknown> = Promise.resolve()
    worker.get("activate")?.({ waitUntil: (promise: Promise<unknown>) => (activated = promise) })
    await activated
    expect(store.delete).toHaveBeenCalledTimes(1)
    expect(store.delete).toHaveBeenCalledWith("antigo")
  })
})
