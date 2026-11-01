// Service worker dos apps instaláveis (Pedidos na Mão e Tá na Entrega).
// Só serve a página offline quando uma navegação falha. Nunca guarda respostas da API, de autenticação ou de
// pedidos: dados de pedido e sessão não podem ficar em cache.
const CACHE = "delivery-shell-v1"
const OFFLINE_URL = "/offline.html"

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET" || request.mode !== "navigate") return
  const { pathname } = new URL(request.url)
  if (pathname.startsWith("/api/")) return
  event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
})
