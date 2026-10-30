import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const cookieHeader = vi.hoisted(() => ({ value: "better-auth.session_token=abc" }))
vi.mock("next/headers", () => ({ cookies: async () => ({ toString: () => cookieHeader.value }) }))

import { getSessionUser } from "@/lib/session"

const user = { id: "u1", email: "a@b.test", name: "A", role: "restaurant_staff", restaurantIds: ["rest_1"] }
const meta = { requestId: "req_000000001", apiVersion: "v1" }

describe("getSessionUser", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    process.env.CASA_DAS_MAQUINAS_URL = "http://api.test"
    cookieHeader.value = "better-auth.session_token=abc"
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => vi.unstubAllGlobals())

  it("repassa o cookie para /v1/me e devolve o usuário validado", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ data: user, error: null, meta }))
    await expect(getSessionUser()).resolves.toEqual(user)
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit & { headers: Record<string, string> }]
    expect(url.toString()).toBe("http://api.test/v1/me")
    expect(init.headers.cookie).toBe("better-auth.session_token=abc")
  })

  it("não chama o backend sem cookie ou sem URL configurada", async () => {
    cookieHeader.value = ""
    await expect(getSessionUser()).resolves.toBeNull()
    cookieHeader.value = "x=1"
    delete process.env.CASA_DAS_MAQUINAS_URL
    await expect(getSessionUser()).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("trata 401, resposta fora do contrato e falha de rede como sem sessão", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ data: null, error: { code: "unauthenticated", message: "x" }, meta }, { status: 401 }),
    )
    await expect(getSessionUser()).resolves.toBeNull()

    fetchMock.mockResolvedValueOnce(Response.json({ data: { ...user, role: "root" }, error: null, meta }))
    await expect(getSessionUser()).resolves.toBeNull()

    fetchMock.mockRejectedValueOnce(new TypeError("network down"))
    await expect(getSessionUser()).resolves.toBeNull()
  })
})
