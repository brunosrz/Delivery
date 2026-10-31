import { beforeEach, describe, expect, it, vi } from "vitest"

const getMenu = vi.fn()
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND")
})

vi.mock("next/navigation", () => ({ notFound: () => notFound() }))
vi.mock("@/lib/api", () => ({ getApiClient: () => (process.env.CASA_DAS_MAQUINAS_URL ? { getMenu } : null) }))

import { loadMenu } from "@/app/delivery-express/menu"

describe("loadMenu", () => {
  beforeEach(() => {
    getMenu.mockReset()
    notFound.mockClear()
    process.env.CASA_DAS_MAQUINAS_URL = "http://api.test"
  })

  it("trata a API não configurada como indisponível", async () => {
    delete process.env.CASA_DAS_MAQUINAS_URL
    await expect(loadMenu("pizzaria")).resolves.toEqual({ status: "unavailable" })
  })

  it("devolve o cardápio quando a API responde", async () => {
    const menu = { restaurant: { slug: "pizzaria" }, sections: [] }
    getMenu.mockResolvedValueOnce({ ok: true, data: menu, requestId: "r" })
    await expect(loadMenu("pizzaria")).resolves.toEqual({ status: "ok", menu })
  })

  it.each(["not_found", "bad_request"])("converte %s em 404", async (code) => {
    getMenu.mockResolvedValueOnce({ ok: false, status: 404, error: { code, message: "x" }, requestId: "r" })
    await expect(loadMenu("x")).rejects.toThrow("NEXT_NOT_FOUND")
  })

  it.each(["unavailable", "internal"])("trata %s como indisponível sem 404", async (code) => {
    getMenu.mockResolvedValueOnce({ ok: false, status: 503, error: { code, message: "x" }, requestId: null })
    await expect(loadMenu("x")).resolves.toEqual({ status: "unavailable" })
    expect(notFound).not.toHaveBeenCalled()
  })
})
