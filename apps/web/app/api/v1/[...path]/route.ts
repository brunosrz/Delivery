// Repassa chamadas do navegador à Casa das Máquinas. O navegador fala só com o próprio site (cookie de sessão
// first-party, sem CORS). Só as rotas que a sacola e o checkout usam passam por aqui.

const FORWARDED_REQUEST_HEADERS = ["accept", "content-type", "cookie", "idempotency-key", "user-agent"]
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/

type Allowed = { methods: readonly string[]; pattern: RegExp }

/** Lista fechada: qualquer outro caminho (inclusive /v1/manage, /v1/me e o webhook) é recusado. */
const ALLOWED: readonly Allowed[] = [
  { methods: ["POST"], pattern: /^quotes$/ },
  { methods: ["POST"], pattern: /^orders$/ },
  { methods: ["GET"], pattern: /^orders$/ },
  { methods: ["GET"], pattern: /^orders\/[A-Za-z0-9_-]{1,64}$/ },
  { methods: ["POST"], pattern: /^orders\/[A-Za-z0-9_-]{1,64}\/payment$/ },
  // Equipe do restaurante e entregadores; o backend valida papel e vínculo com o restaurante.
  { methods: ["POST"], pattern: /^orders\/[A-Za-z0-9_-]{1,64}\/transitions$/ },
]

export function isAllowed(method: string, path: readonly string[]): boolean {
  const joined = path.join("/")
  return ALLOWED.some((rule) => rule.methods.includes(method) && rule.pattern.test(joined))
}

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
