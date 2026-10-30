import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GET, POST } from "@/app/api/auth/[...all]/route"
import { safeRedirectPath } from "@/lib/safe-redirect"

const params = (...all: string[]) => ({ params: Promise.resolve({ all }) })

describe("proxy /api/auth", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    process.env.CASA_DAS_MAQUINAS_URL = "http://api.test"
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  it("repassa método, corpo, query e só os headers permitidos", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }))
    const request = new Request("http://web.test/api/auth/sign-in/email?x=1", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "a=b",
        origin: "http://web.test",
        authorization: "Bearer vazado",
        "x-forwarded-for": "203.0.113.7",
      },
      body: JSON.stringify({ email: "a@b.c" }),
    })

    await POST(request, params("sign-in", "email"))

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit & { headers: Headers }]
    expect(url.toString()).toBe("http://api.test/api/auth/sign-in/email?x=1")
    expect(init.method).toBe("POST")
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe('{"email":"a@b.c"}')
    expect(init.headers.get("cookie")).toBe("a=b")
    expect(init.headers.get("origin")).toBe("http://web.test")
    expect(init.headers.get("x-forwarded-for")).toBe("203.0.113.7")
    expect(init.headers.get("authorization")).toBeNull()
    expect(init.redirect).toBe("manual")
  })

  it("devolve todos os set-cookie do backend e o status original", async () => {
    const headers = new Headers({ "content-type": "application/json" })
    headers.append("set-cookie", "better-auth.session_token=abc; Path=/; HttpOnly")
    headers.append("set-cookie", "better-auth.session_data=xyz; Path=/; HttpOnly")
    fetchMock.mockResolvedValueOnce(new Response('{"ok":true}', { status: 201, headers }))

    const response = await GET(new Request("http://web.test/api/auth/get-session"), params("get-session"))

    expect(response.status).toBe(201)
    expect(response.headers.getSetCookie()).toHaveLength(2)
    expect(await response.text()).toBe('{"ok":true}')
  })

  it("codifica segmentos do caminho", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await GET(new Request("http://web.test/api/auth/x"), params("callback", "a/b c"))
    expect((fetchMock.mock.calls[0] as [URL])[0].toString()).toBe("http://api.test/api/auth/callback/a%2Fb%20c")
  })

  it.each([[["..", "..", "v1", "manage"]], [[".", "x"]], [["get-session", ".."]]])(
    "recusa travessia de caminho %j sem chamar o backend",
    async (segments) => {
      const response = await GET(
        new Request("http://web.test/api/auth/x", { headers: { cookie: "a=b" } }),
        params(...segments),
      )
      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it("responde 503 sem backend configurado ou fora do ar", async () => {
    delete process.env.CASA_DAS_MAQUINAS_URL
    expect((await GET(new Request("http://web.test/api/auth/get-session"), params("get-session"))).status).toBe(503)

    process.env.CASA_DAS_MAQUINAS_URL = "http://api.test"
    fetchMock.mockRejectedValueOnce(new TypeError("network down"))
    expect((await GET(new Request("http://web.test/api/auth/get-session"), params("get-session"))).status).toBe(503)
  })
})

describe("safeRedirectPath", () => {
  it.each([
    ["/pedidos-na-mao", "/pedidos-na-mao"],
    ["/delivery-express?x=1", "/delivery-express?x=1"],
    [null, "/"],
    ["", "/"],
    ["https://atacante.example", "/"],
    ["//atacante.example", "/"],
    ["/\\atacante.example", "/"],
    ["javascript:alert(1)", "/"],
  ])("%s -> %s", (value, expected) => {
    expect(safeRedirectPath(value)).toBe(expected)
  })
})
