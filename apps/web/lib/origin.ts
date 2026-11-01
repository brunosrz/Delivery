/**
 * Defesa contra CSRF no proxy: requisição que muda estado e vem de outro site é recusada, mesmo com o cookie da
 * sessão (SameSite=Lax já barra a maioria; isto fecha o resto). Navegadores sempre mandam Origin e Sec-Fetch-Site em
 * POST/PATCH/DELETE; chamadas sem esses cabeçalhos (ferramentas, testes) não carregam cookie de navegador.
 */
export function isSameOriginRequest(request: Request): boolean {
  if (request.method === "GET" || request.method === "HEAD") return true

  const site = request.headers.get("sec-fetch-site")
  if (site && site !== "same-origin" && site !== "none") return false

  const origin = request.headers.get("origin")
  if (!origin) return true
  const expectedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host
  try {
    return new URL(origin).host === expectedHost
  } catch {
    return false
  }
}
