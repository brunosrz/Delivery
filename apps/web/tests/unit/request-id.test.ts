import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/headers", () => ({ cookies: async () => ({ toString: () => "better-auth.session_token=abc" }) }))

import { GET } from "@/app/api/auth/[...all]/route"
import { getApiClient } from "@/lib/api"
import { getSessionUser } from "@/lib/session"

const params = (...all: string[]) => ({ params: Promise.resolve({ all }) })
const UUID = /^[0-9a-f-]{36}$/

describe("propagação do x-request-id", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    process.env.CASA_DAS_MAQUINAS_URL = "http://api.test"
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => vi.unstubAllGlobals())

  it("o proxy mantém o id válido recebido e o devolve na resposta", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }))
    const response = await GET(
      new Request("http://web.test/api/auth/get-session", { headers: { "x-request-id": "origem-12345678" } }),
      params("get-session"),
    )
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit & { headers: Headers }]
    expect(init.headers.get("x-request-id")).toBe("origem-12345678")
    expect(response.headers.get("x-request-id")).toBe("origem-12345678")
  })

  it("o proxy cria um id quando falta ou é inválido, inclusive na resposta de erro", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }))
    await GET(
      new Request("http://web.test/api/auth/x", { headers: { "x-request-id": "curto" } }),
      params("get-session"),
    )
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit & { headers: Headers }]
    expect(init.headers.get("x-request-id")).toMatch(UUID)

    fetchMock.mockRejectedValueOnce(new TypeError("down"))
    const failed = await GET(new Request("http://web.test/api/auth/x"), params("get-session"))
    expect(failed.status).toBe(503)
    expect(failed.headers.get("x-request-id")).toMatch(UUID)
  })

  it("getSessionUser e o cliente da API enviam um id por chamada", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ data: null, error: null }))
    await getSessionUser()
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit & { headers: Record<string, string> }]
    expect(init.headers["x-request-id"]).toMatch(UUID)

    fetchMock.mockResolvedValueOnce(
      Response.json({ data: [], error: null, meta: { requestId: "req_12345678", apiVersion: "v1" } }),
    )
    await getApiClient()?.listRestaurants()
    const [, apiInit] = fetchMock.mock.calls[1] as [string, RequestInit & { headers: Record<string, string> }]
    expect(apiInit.headers["x-request-id"]).toMatch(UUID)
  })
})

describe("timeouts do backend", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    process.env.CASA_DAS_MAQUINAS_URL = "http://api.test"
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
    // O limite real é de segundos; o teste só precisa do sinal de timeout já disparado.
    vi.spyOn(AbortSignal, "timeout").mockImplementation(() =>
      AbortSignal.abort(new DOMException("limite", "TimeoutError")),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  /** fetch que nunca responde: só termina porque o AbortSignal do chamador dispara. */
  const hang = (_url: unknown, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      if (init?.signal?.aborted) reject(init.signal.reason)
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason))
    })

  it("o proxy responde 503 quando o backend não responde dentro do limite", async () => {
    fetchMock.mockImplementation(hang)
    const response = await GET(new Request("http://web.test/api/auth/get-session"), params("get-session"))
    expect(response.status).toBe(503)
  })

  it("getSessionUser trata o timeout como sem sessão", async () => {
    fetchMock.mockImplementation(hang)
    await expect(getSessionUser()).resolves.toBeNull()
    expect(AbortSignal.timeout).toHaveBeenCalled()
  })
})
