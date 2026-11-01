import { describe, expect, it, vi } from "vitest"
import { DELETE_ACCOUNT_CONFIRMATION, deleteAccount, exportFilename, fetchAccountExport } from "@/lib/account-client"

const meta = { requestId: "req-12345678", apiVersion: "v1" }
const asFetch = (fn: unknown) => fn as typeof fetch

describe("exportFilename", () => {
  it("usa a data de hoje", () => {
    expect(exportFilename(new Date("2026-11-01T15:00:00Z"))).toBe("meus-dados-2026-11-01.json")
  })
})

describe("fetchAccountExport", () => {
  it("devolve o JSON formatado só com o campo data", async () => {
    const doFetch = vi.fn(async () => Response.json({ data: { user: { id: "u1" } }, error: null, meta }))
    const result = await fetchAccountExport(asFetch(doFetch))
    expect(result).toEqual({ ok: true, data: JSON.stringify({ user: { id: "u1" } }, null, 2) })
    expect(doFetch).toHaveBeenCalledWith("/api/v1/me/export", { headers: { accept: "application/json" } })
  })

  it("mantém a mensagem de erro do servidor", async () => {
    const doFetch = vi.fn(async () =>
      Response.json(
        { data: null, error: { code: "unauthenticated", message: "sessão expirada" }, meta },
        { status: 401 },
      ),
    )
    expect(await fetchAccountExport(asFetch(doFetch))).toEqual({ ok: false, status: 401, message: "sessão expirada" })
  })

  it("trata rede fora do ar e corpo que não é JSON", async () => {
    const down = vi.fn(async () => {
      throw new TypeError("offline")
    })
    expect(await fetchAccountExport(asFetch(down))).toMatchObject({ ok: false, status: 0 })
    const html = vi.fn(async () => new Response("<html>", { status: 502 }))
    expect(await fetchAccountExport(asFetch(html))).toMatchObject({ ok: false, status: 502 })
  })
})

describe("deleteAccount", () => {
  it("envia DELETE com a frase de confirmação", async () => {
    const doFetch = vi.fn(async () => Response.json({ data: { deleted: true }, error: null, meta }))
    expect(await deleteAccount(DELETE_ACCOUNT_CONFIRMATION, asFetch(doFetch))).toEqual({
      ok: true,
      data: { deleted: true },
    })
    const [url, init] = doFetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("/api/v1/me")
    expect(init.method).toBe("DELETE")
    expect(JSON.parse(init.body as string)).toEqual({ confirm: DELETE_ACCOUNT_CONFIRMATION })
  })

  it("devolve o motivo quando há pedido em andamento", async () => {
    const doFetch = vi.fn(async () =>
      Response.json(
        { data: null, error: { code: "conflict", message: "há pedidos em andamento" }, meta },
        { status: 409 },
      ),
    )
    expect(await deleteAccount(DELETE_ACCOUNT_CONFIRMATION, asFetch(doFetch))).toEqual({
      ok: false,
      status: 409,
      message: "há pedidos em andamento",
    })
  })

  it("rede fora do ar vira erro legível", async () => {
    const down = vi.fn(async () => {
      throw new TypeError("offline")
    })
    expect(await deleteAccount(DELETE_ACCOUNT_CONFIRMATION, asFetch(down))).toMatchObject({ ok: false, status: 0 })
  })
})
