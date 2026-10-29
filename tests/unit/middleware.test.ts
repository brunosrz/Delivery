import { describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

import { config, middleware } from "@/middleware"
import { matchesRoute, protectedRoutes } from "@/lib/route-access"

const { getToken } = vi.hoisted(() => ({ getToken: vi.fn() }))
vi.mock("next-auth/jwt", () => ({ getToken }))

function request(path: string) {
  return new NextRequest(new URL(path, "https://delivery.test"))
}

describe("matchesRoute", () => {
  it.each([
    ["/pedidos-na-mao", true],
    ["/pedidos-na-mao/fila", true],
    ["/pedidos-na-mao-x", false],
    ["/pedidos", false],
  ])("%s -> %s", (pathname, expected) => {
    expect(matchesRoute(pathname, "/pedidos-na-mao")).toBe(expected)
  })
})

describe("middleware", () => {
  it("redireciona rota protegida sem token para o login com callbackUrl relativo", async () => {
    getToken.mockResolvedValueOnce(null)
    const response = await middleware(request("/ta-na-entrega/pedidos?aba=ativos"))
    const location = new URL(response.headers.get("location") ?? "")
    expect(response.status).toBe(307)
    expect(location.pathname).toBe("/auth/login")
    expect(location.searchParams.get("callbackUrl")).toBe("/ta-na-entrega/pedidos?aba=ativos")
  })

  it("deixa passar rota protegida com token", async () => {
    getToken.mockResolvedValueOnce({ sub: "user-1" })
    const response = await middleware(request("/pedidos-na-mao"))
    expect(response.headers.get("location")).toBeNull()
    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it("redireciona usuário autenticado para fora das telas de login", async () => {
    getToken.mockResolvedValueOnce({ sub: "user-1" })
    const response = await middleware(request("/auth/login"))
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/")
  })

  it("não trata rotas vizinhas como protegidas", async () => {
    getToken.mockResolvedValueOnce(null)
    const response = await middleware(request("/pedidos-na-mao-demo"))
    expect(response.headers.get("location")).toBeNull()
  })

  it("mantém o matcher estático alinhado às rotas protegidas", () => {
    expect(config.matcher).toEqual(expect.arrayContaining(protectedRoutes.map((route) => `${route}/:path*`)))
    expect(config.matcher).toEqual(expect.arrayContaining(["/auth/login/:path*", "/auth/register/:path*"]))
  })
})
