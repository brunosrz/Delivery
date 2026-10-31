// Repassa /api/auth/* para a Casa das Máquinas (Better Auth). O navegador fala só
// com o próprio site, então o cookie de sessão é first-party e não depende de
// cookies entre domínios (Vercel <-> workers.dev).

const FORWARDED_REQUEST_HEADERS = ["accept", "content-type", "cookie", "origin", "referer", "user-agent"]
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/

async function proxy(request: Request, { params }: { params: Promise<{ all: string[] }> }) {
  const baseUrl = process.env.CASA_DAS_MAQUINAS_URL
  if (!baseUrl) {
    return Response.json({ message: "autenticação indisponível" }, { status: 503 })
  }

  const { all } = await params
  // "." e ".." resolveriam para fora de /api/auth e levariam o cookie do usuário a outras rotas.
  if (all.some((segment) => segment === "." || segment === "..")) {
    return Response.json({ message: "caminho inválido" }, { status: 400 })
  }
  const incoming = new URL(request.url)
  const target = new URL(`/api/auth/${all.map(encodeURIComponent).join("/")}${incoming.search}`, baseUrl)
  if (!target.pathname.startsWith("/api/auth/")) {
    return Response.json({ message: "caminho inválido" }, { status: 400 })
  }

  const headers = new Headers()
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  const clientIp = request.headers.get("x-forwarded-for")
  if (clientIp) headers.set("x-forwarded-for", clientIp)
  // Mantém o id de correlação recebido (se válido) ou cria um, para ligar o log do web ao da API.
  const incomingId = request.headers.get("x-request-id")
  const requestId = incomingId && REQUEST_ID_PATTERN.test(incomingId) ? incomingId : crypto.randomUUID()
  headers.set("x-request-id", requestId)

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    return Response.json(
      { message: "autenticação indisponível" },
      { status: 503, headers: { "x-request-id": requestId } },
    )
  }

  const responseHeaders = new Headers()
  for (const [name, value] of upstream.headers) {
    if (name === "set-cookie" || name === "content-encoding" || name === "content-length") continue
    responseHeaders.set(name, value)
  }
  for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append("set-cookie", cookie)
  responseHeaders.set("x-request-id", requestId)

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
}

export { proxy as GET, proxy as POST }
