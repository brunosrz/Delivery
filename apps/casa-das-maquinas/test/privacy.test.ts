import {
  AccountExport,
  CONSENT_VERSION,
  DELETE_ACCOUNT_CONFIRMATION,
  LEGAL_VERSIONS,
  envelope,
} from "@delivery/contracts"
import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { RETENTION_DAYS, purgeExpired } from "../src/retention"
import { call, newUser, postJson, signUp } from "./helpers"

const consent = (overrides: Record<string, unknown> = {}) => ({
  consentId: crypto.randomUUID(),
  version: CONSENT_VERSION,
  analytics: true,
  marketing: false,
  source: "banner",
  locale: "pt-BR",
  ...overrides,
})
const consentRows = (consentId: string) =>
  env.DB.prepare("select * from consent_records where consent_id = ?")
    .bind(consentId)
    .all<{ analytics: number; marketing: number; source: string; ip_hash: string | null; user_id: string | null }>()
    .then((result) => result.results)
const remove = (cookie: string) =>
  call("/v1/me", {
    method: "DELETE",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ confirm: DELETE_ACCOUNT_CONFIRMATION }),
  })

describe("POST /v1/consents", () => {
  it("grava a escolha do visitante sem sessão, com o IP só em hash", async () => {
    const body = consent()
    const response = await postJson("/v1/consents", body, { "cf-connecting-ip": "203.0.113.77" })
    expect(response.status).toBe(200)
    const [row] = await consentRows(body.consentId)
    expect(row).toMatchObject({ analytics: 1, marketing: 0, source: "banner", user_id: null })
    expect(row?.ip_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(JSON.stringify(row)).not.toContain("203.0.113.77")
  })

  it("liga o registro à conta quando há sessão", async () => {
    const { cookie, userId } = await newUser()
    const body = consent({ marketing: true })
    expect((await postJson("/v1/consents", body, { cookie })).status).toBe(200)
    expect((await consentRows(body.consentId))[0]).toMatchObject({ user_id: userId, marketing: 1 })
  })

  it("Global Privacy Control vale como recusa, mesmo que o corpo diga sim", async () => {
    const body = consent({ analytics: true, marketing: true })
    expect((await postJson("/v1/consents", body, { "sec-gpc": "1" })).status).toBe(200)
    expect((await consentRows(body.consentId))[0]).toMatchObject({ analytics: 0, marketing: 0, source: "gpc" })
  })

  it("recusa versão desatualizada, campo extra e corpo inválido", async () => {
    expect((await postJson("/v1/consents", consent({ version: CONSENT_VERSION + 1 }))).status).toBe(400)
    expect((await postJson("/v1/consents", { ...consent(), extra: true })).status).toBe(400)
    expect((await postJson("/v1/consents", consent({ consentId: "nao-e-uuid" }))).status).toBe(400)
    expect((await postJson("/v1/consents", {})).status).toBe(400)
  })
})

describe("POST /v1/legal/acceptances", () => {
  const accept = (cookie?: string, body: unknown = LEGAL_VERSIONS) =>
    postJson("/v1/legal/acceptances", body, cookie ? { cookie } : {})

  it("exige sessão", async () => {
    expect((await accept()).status).toBe(401)
  })

  it("registra os dois documentos e repetir não duplica", async () => {
    const { cookie, userId } = await newUser()
    expect((await accept(cookie)).status).toBe(200)
    expect((await accept(cookie)).status).toBe(200)
    const rows = await env.DB.prepare(
      "select document, version from legal_acceptances where user_id = ? order by document",
    )
      .bind(userId)
      .all<{ document: string; version: string }>()
    expect(rows.results).toEqual([
      { document: "privacy", version: LEGAL_VERSIONS.privacy },
      { document: "terms", version: LEGAL_VERSIONS.terms },
    ])
  })

  it("recusa versão que não é a vigente e nada é gravado", async () => {
    const { cookie, userId } = await newUser()
    expect((await accept(cookie, { terms: "1999-01-01", privacy: LEGAL_VERSIONS.privacy })).status).toBe(400)
    expect((await accept(cookie, { terms: LEGAL_VERSIONS.terms })).status).toBe(400)
    const count = await env.DB.prepare("select count(*) as n from legal_acceptances where user_id = ?")
      .bind(userId)
      .first<{ n: number }>()
    expect(count?.n).toBe(0)
  })
})

describe("dados do titular: exportação e exclusão", () => {
  it("a exportação inclui aceites e consentimentos ligados à conta", async () => {
    const { cookie } = await newUser()
    const body = consent({ marketing: true })
    await postJson("/v1/legal/acceptances", LEGAL_VERSIONS, { cookie })
    await postJson("/v1/consents", body, { cookie })

    const { data } = envelope(AccountExport).parse(await (await call("/v1/me/export", { headers: { cookie } })).json())
    expect(data?.legal.acceptances.map((item) => item.document).sort()).toEqual(["privacy", "terms"])
    expect(data?.legal.consents).toEqual([
      expect.objectContaining({ consentId: body.consentId, analytics: true, marketing: true, source: "banner" }),
    ])
  })

  it("exportar e excluir ficam no registro de solicitações, sem dado pessoal", async () => {
    const { cookie, userId } = await newUser()
    await call("/v1/me/export", { headers: { cookie } })
    expect((await remove(cookie)).status).toBe(200)

    const { saltedHash } = await import("../src/hash")
    const rows = await env.DB.prepare(
      "select type, status from data_requests where subject_hash = ? order by created_at",
    )
      .bind(await saltedHash(env, "subject", userId))
      .all<{ type: string; status: string }>()
    expect(rows.results).toEqual([
      { type: "export", status: "completed" },
      { type: "delete", status: "completed" },
    ])
    const columns = await env.DB.prepare(
      "select group_concat(name) as names from pragma_table_info('data_requests')",
    ).first<{
      names: string
    }>()
    expect(columns?.names).not.toMatch(/email|user_id|name_/)
  })

  it("exclusão recusada também é registrada", async () => {
    const courier = await newUser("courier")
    expect((await remove(courier.cookie)).status).toBe(403)
    const { saltedHash } = await import("../src/hash")
    const row = await env.DB.prepare("select status, reason from data_requests where subject_hash = ?")
      .bind(await saltedHash(env, "subject", courier.userId))
      .first<{ status: string; reason: string }>()
    expect(row).toMatchObject({ status: "refused" })
    expect(row?.reason).toContain("só contas de cliente")
  })

  it("exige sessão recente: cookie antigo não apaga a conta", async () => {
    const { cookie, userId } = await newUser()
    await env.DB.prepare("update session set created_at = ? where user_id = ?")
      .bind(Date.now() - 16 * 60 * 1000, userId)
      .run()
    const response = await remove(cookie)
    expect(response.status).toBe(401)
    expect(((await response.json()) as { error: { message: string } }).error.message).toContain("entre novamente")
    const still = await env.DB.prepare("select email from user where id = ?").bind(userId).first<{ email: string }>()
    expect(still?.email).not.toContain("excluido-")
  })

  it("a exclusão apaga mensagens de contato do e-mail, aceites e desliga o consentimento da pessoa", async () => {
    const email = `titular-${crypto.randomUUID().slice(0, 8)}@example.test`
    const { cookie, userId } = await signUp(email)
    const body = consent()
    await postJson("/v1/legal/acceptances", LEGAL_VERSIONS, { cookie })
    await postJson("/v1/consents", body, { cookie })
    await env.DB.batch([
      env.DB.prepare(
        "insert into contact_messages (id, name, email, message, ip_hash) values ('cm1', 'Titular', ?, 'oi', 'h')",
      ).bind(email.toUpperCase()),
      env.DB.prepare(
        "insert into contact_messages (id, name, email, message, ip_hash) values ('cm2', 'Outra', 'outra@example.test', 'oi', 'h')",
      ),
    ])

    expect((await remove(cookie)).status).toBe(200)

    const count = (sql: string, ...binds: unknown[]) =>
      env.DB.prepare(sql)
        .bind(...binds)
        .first<{ n: number }>()
        .then((row) => row?.n)
    expect(await count("select count(*) as n from contact_messages where id = 'cm1'")).toBe(0)
    expect(await count("select count(*) as n from contact_messages where id = 'cm2'")).toBe(1)
    expect(await count("select count(*) as n from legal_acceptances where user_id = ?", userId)).toBe(0)
    // A prova do consentimento continua, mas sem apontar para a pessoa.
    expect((await consentRows(body.consentId))[0]).toMatchObject({ user_id: null })
  })
})

describe("retenção de dados", () => {
  const day = 24 * 60 * 60 * 1000

  it("apaga o que passou do prazo e mantém o que está dentro", async () => {
    const now = Date.now()
    const ago = (days: number) => new Date(now - days * day).toISOString()
    await env.DB.batch([
      env.DB.prepare(
        "insert into contact_messages (id, name, email, message, ip_hash, created_at) values ('r_old', 'a', 'a@x.test', 'm', 'h', ?)",
      ).bind(ago(RETENTION_DAYS.contactMessages + 1)),
      env.DB.prepare(
        "insert into contact_messages (id, name, email, message, ip_hash, created_at) values ('r_new', 'a', 'a@x.test', 'm', 'h', ?)",
      ).bind(ago(RETENTION_DAYS.contactMessages - 1)),
      env.DB.prepare(
        "insert into consent_records (id, consent_id, version, analytics, marketing, source, locale, created_at) values ('c_old', 'x', 1, 0, 0, 'banner', 'en', ?)",
      ).bind(ago(RETENTION_DAYS.consentRecords + 1)),
      env.DB.prepare(
        "insert into consent_records (id, consent_id, version, analytics, marketing, source, locale, created_at) values ('c_new', 'x', 1, 0, 0, 'banner', 'en', ?)",
      ).bind(ago(10)),
      env.DB.prepare(
        "insert into data_requests (id, subject_hash, type, status, created_at) values ('d_old', 'h', 'export', 'completed', ?)",
      ).bind(ago(RETENTION_DAYS.dataRequests + 1)),
      env.DB.prepare(
        "insert into verification (id, identifier, value, expires_at, created_at, updated_at) values ('v_old', 'i', 'v', ?, 0, 0)",
      ).bind(now - day),
      env.DB.prepare(
        "insert into verification (id, identifier, value, expires_at, created_at, updated_at) values ('v_new', 'i', 'v', ?, 0, 0)",
      ).bind(now + day),
    ])

    const result = await purgeExpired(env, now)
    expect(result).toMatchObject({ contactMessages: 1, consentRecords: 1, dataRequests: 1, verifications: 1 })

    const ids = async (table: string, known: string[]) =>
      (
        await env.DB.prepare(`select id from ${table} where id in (${known.map(() => "?").join(", ")})`)
          .bind(...known)
          .all<{ id: string }>()
      ).results.map((row) => row.id)
    expect(await ids("contact_messages", ["r_old", "r_new"])).toEqual(["r_new"])
    expect(await ids("consent_records", ["c_old", "c_new"])).toEqual(["c_new"])
    expect(await ids("verification", ["v_old", "v_new"])).toEqual(["v_new"])
    // Rodar de novo não apaga nada além do já apagado.
    expect(await purgeExpired(env, now)).toMatchObject({
      contactMessages: 0,
      consentRecords: 0,
      dataRequests: 0,
      verifications: 0,
    })
  })
})

describe("cabeçalhos de segurança da API", () => {
  it("toda resposta leva os cabeçalhos de proteção", async () => {
    const response = await call("/v1/health")
    expect(response.headers.get("x-content-type-options")).toBe("nosniff")
    expect(response.headers.get("x-frame-options")).toBe("DENY")
    expect(response.headers.get("referrer-policy")).toBe("no-referrer")
    expect(response.headers.get("strict-transport-security")).toContain("max-age=")
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'")
    expect(response.headers.get("cache-control")).not.toBe("no-store")
  })

  it("rotas com dado pessoal nunca são guardadas em cache", async () => {
    const { cookie } = await newUser()
    for (const path of ["/v1/me", "/v1/me/export", "/v1/orders"]) {
      const response = await call(path, { headers: { cookie } })
      expect(response.headers.get("cache-control"), path).toBe("no-store")
    }
    const denied = await call("/v1/me")
    expect(denied.status).toBe(401)
    expect(denied.headers.get("cache-control")).toBe("no-store")
    expect((await postJson("/v1/consents", consent())).headers.get("cache-control")).toBe("no-store")
  })

  it("o cookie de sessão é HttpOnly e SameSite=Lax", async () => {
    const response = await postJson(
      "/api/auth/sign-up/email",
      {
        email: `cookie-${crypto.randomUUID().slice(0, 8)}@example.test`,
        password: "senha-forte-123",
        name: "Pessoa Teste",
      },
      { origin: "http://localhost:3000" },
    )
    const cookie = response.headers.getSetCookie().find((value) => value.includes("session_token")) ?? ""
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/SameSite=Lax/i)
  })
})
