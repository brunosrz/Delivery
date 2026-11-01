import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { pruneRateLimits } from "../src/rate-limit"
import { newUser, postJson } from "./helpers"

const QUOTES_LIMIT = 60
const ORDERS_LIMIT = 15
// O limite roda antes da validação: corpo vazio responde 400 enquanto há cota e 429 depois.
const quote = (ip: string) => postJson("/v1/quotes", {}, { "cf-connecting-ip": ip })
const ipOf = () => `203.0.113.${Math.floor(Math.random() * 250) + 1}-${crypto.randomUUID()}`

describe("limite de requisições", () => {
  it("responde 429 com Retry-After e envelope depois da cota, e não afeta outro IP", async () => {
    const ip = ipOf()
    for (let n = 0; n < QUOTES_LIMIT; n++) expect((await quote(ip)).status).toBe(400)

    const blocked = await quote(ip)
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThanOrEqual(1)
    expect(Number(blocked.headers.get("retry-after"))).toBeLessThanOrEqual(60)
    expect(blocked.headers.get("x-request-id")).toBeTruthy()
    expect(((await blocked.json()) as { data: unknown; error: { code: string } }).error.code).toBe("rate_limited")

    expect((await quote(ipOf())).status).toBe(400)
  })

  it("conta de forma atômica com requisições simultâneas", async () => {
    const ip = ipOf()
    const responses = await Promise.all(Array.from({ length: QUOTES_LIMIT + 10 }, () => quote(ip)))
    expect(responses.filter((response) => response.status === 429)).toHaveLength(10)
    expect(responses.filter((response) => response.status === 400)).toHaveLength(QUOTES_LIMIT)
  })

  it("limita por usuário da sessão, sem misturar usuários", async () => {
    const first = await newUser()
    const second = await newUser()
    const create = (cookie: string) => postJson("/v1/orders", {}, { cookie })
    for (let n = 0; n < ORDERS_LIMIT; n++) expect((await create(first.cookie)).status).toBe(400)
    expect((await create(first.cookie)).status).toBe(429)
    expect((await create(second.cookie)).status).toBe(400)
  })

  it("não grava o IP: a chave é um hash", async () => {
    const ip = ipOf()
    await quote(ip)
    const { results } = await env.DB.prepare("select key from rate_limit_buckets").all<{ key: string }>()
    expect(results.length).toBeGreaterThan(0)
    for (const row of results) expect(row.key).toMatch(/^[0-9a-f]{64}$/)
  })

  it("o cron apaga janelas antigas e mantém as recentes", async () => {
    const now = Date.now()
    const old = Math.floor(now / 1000) - 3 * 24 * 60 * 60
    const recent = Math.floor(now / 1000)
    await env.DB.batch([
      env.DB.prepare("insert into rate_limit_buckets (key, window_start, count) values ('antiga', ?, 1)").bind(old),
      env.DB.prepare("insert into rate_limit_buckets (key, window_start, count) values ('recente', ?, 1)").bind(recent),
    ])
    expect(await pruneRateLimits(env, now)).toBeGreaterThanOrEqual(1)
    const { results } = await env.DB.prepare(
      "select key from rate_limit_buckets where key in ('antiga','recente')",
    ).all<{
      key: string
    }>()
    expect(results.map((row) => row.key)).toEqual(["recente"])
  })
})
