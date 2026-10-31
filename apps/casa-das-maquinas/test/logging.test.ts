import { Hono } from "hono"
import { afterEach, describe, expect, it, vi } from "vitest"
import { type AppEnv, logError, requestId } from "../src/http"
import { asaasDateTimeToIso } from "../src/asaas"
import { redact } from "../src/redact"
import { call } from "./helpers"

afterEach(() => vi.restoreAllMocks())

describe("redact", () => {
  it.each([
    ["Authorization: Bearer abc.def.ghi123", "abc.def.ghi123"],
    ["falha com Bearer abc.def.ghi123 no upstream", "abc.def.ghi123"],
    ["cookie: better-auth.session_token=abcDEF123; Path=/", "abcDEF123"],
    ["Set-Cookie: better-auth.session_token=zzz987; HttpOnly", "zzz987"],
    ["GET /v1/live/ws?ticket=eyJhbGciOi.xyz&x=1", "eyJhbGciOi.xyz"],
    ["token=segredo123 password: hunter2", "hunter2"],
    ["chave $aact_hmlg_000abcDEF.123 usada", "000abcDEF"],
    ["asaas-access-token: tok_123456789", "tok_123456789"],
    ['{"apiKey":"abc123","name":"Maria"}', "abc123"],
  ])("mascara %s", (input, secret) => {
    const output = redact(input)
    expect(output).not.toContain(secret)
    expect(output).toContain("***")
  })

  it("não altera texto sem credenciais", () => {
    expect(redact("pedido 42 criado para o restaurante rest_burger")).toBe(
      "pedido 42 criado para o restaurante rest_burger",
    )
  })
})

describe("log de acesso", () => {
  it("registra requestId, método, caminho sem query, status e duração, sem credenciais", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined)
    const response = await call("/v1/me?ticket=segredo-do-ticket", {
      headers: {
        "x-request-id": "req-log-0001",
        cookie: "better-auth.session_token=cookie-secreto",
        authorization: "Bearer token-secreto-123",
      },
    })
    expect(response.status).toBe(401)

    const lines = log.mock.calls.map(([line]) => String(line))
    const entry = JSON.parse(lines.find((line) => line.includes('"request"')) ?? "{}") as Record<string, unknown>
    expect(entry).toMatchObject({
      event: "request",
      requestId: "req-log-0001",
      method: "GET",
      path: "/v1/me",
      status: 401,
    })
    expect(typeof entry.durationMs).toBe("number")

    const everything = lines.join("\n")
    for (const secret of ["segredo-do-ticket", "cookie-secreto", "token-secreto-123"]) {
      expect(everything).not.toContain(secret)
    }
  })

  it("mascara credenciais na mensagem de um erro e mantém o requestId", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const app = new Hono<AppEnv>()
    app.use("*", requestId)
    app.get("/falha", () => {
      throw new Error("upstream falhou com Authorization: Bearer token-no-erro-123 e token=outro-segredo")
    })
    app.onError((failure, c) => {
      logError(c, "unhandled_error", failure)
      return c.text("erro", 500)
    })

    const response = await app.request("/falha?ticket=ticket-na-query", {
      headers: { "x-request-id": "req-erro-0001" },
    })
    expect(response.status).toBe(500)

    const lines = error.mock.calls.map(([line]) => String(line))
    const entry = JSON.parse(lines[0] ?? "{}") as Record<string, string>
    expect(entry).toMatchObject({ event: "unhandled_error", requestId: "req-erro-0001", path: "/falha" })
    for (const secret of ["token-no-erro-123", "outro-segredo", "ticket-na-query"]) {
      expect(lines.join(" ")).not.toContain(secret)
    }
  })
})

describe("asaasDateTimeToIso", () => {
  it("converte o formato do Asaas (horário de Brasília) para ISO com fuso", () => {
    expect(asaasDateTimeToIso("2026-12-31 23:59:59")).toBe("2026-12-31T23:59:59-03:00")
  })

  it("mantém ISO e devolve null para o que não reconhece", () => {
    expect(asaasDateTimeToIso("2026-12-31T23:59:59Z")).toBe("2026-12-31T23:59:59Z")
    expect(asaasDateTimeToIso(null)).toBeNull()
    expect(asaasDateTimeToIso("amanhã")).toBeNull()
  })
})
