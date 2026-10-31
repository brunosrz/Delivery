// Repassa chamadas do navegador à Casa das Máquinas. O navegador fala só com o próprio site (cookie de sessão
// first-party, sem CORS). Só as rotas que a sacola e o checkout usam passam por aqui.

import { isAllowed } from "@/lib/api-proxy-rules"

const FORWARDED_REQUEST_HEADERS = ["accept", "content-type", "cookie", "idempotency-key", "user-agent"]
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/

async function proxy(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const baseUrl = process.env.CASA_DAS_MAQUINAS_URL
  if (!baseUrl) return Response.json({ message: "serviço indisponível" }, { status: 503 })

  const { path } = await params
  if (!isAllowed(request.method, path)) return Response.json({ message: "rota não permitida" }, { status: 404 })

  const target = new URL(`/v1/${path.map(encodeURIComponent).join("/")}`, baseUrl)
  const headers = new Headers()
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  // O limite por IP do formulário de contato depende do IP do visitante, não do servidor do Next.
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  if (clientIp) headers.set("cf-connecting-ip", clientIp)
  const incomingId = request.headers.get("x-request-id")
  const requestId = incomingId && REQUEST_ID_PATTERN.test(incomingId) ? incomingId : crypto.randomUUID()
  headers.set("x-request-id", requestId)

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : await request.arrayBuffer(),
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    return Response.json({ message: "serviço indisponível" }, { status: 503, headers: { "x-request-id": requestId } })
  }

  const responseHeaders = new Headers({ "x-request-id": requestId })
  const contentType = upstream.headers.get("content-type")
  if (contentType) responseHeaders.set("content-type", contentType)
  const replayed = upstream.headers.get("idempotent-replayed")
  if (replayed) responseHeaders.set("idempotent-replayed", replayed)
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
}

export { proxy as GET, proxy as POST }
