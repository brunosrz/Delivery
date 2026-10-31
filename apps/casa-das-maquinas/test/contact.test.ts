import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { CONTACT_LIMIT_PER_HOUR } from "../src/contact"
import { call, postJson } from "./helpers"

const message = { name: "Maria da Silva", email: "maria@example.test", message: "Quero conhecer o Delivery Express." }
const count = () => env.DB.prepare("select count(*) as n from contact_messages").first<{ n: number }>()
const post = (body: unknown, ip: string) => postJson("/v1/contact", body, { "cf-connecting-ip": ip })

describe("POST /v1/contact", () => {
  it("grava a mensagem sem guardar o IP em claro", async () => {
    const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`
    const response = await post(message, ip)
    expect(response.status).toBe(200)
    expect(((await response.json()) as { data: unknown }).data).toEqual({ received: true })

    const rows = await env.DB.prepare("select ip_hash as ipHash, email from contact_messages where email = ?")
      .bind(message.email)
      .all<{ ipHash: string; email: string }>()
    expect(rows.results.length).toBeGreaterThan(0)
    for (const row of rows.results) expect(row.ipHash).not.toContain(ip)
  })

  it("responde sucesso e não grava quando o robô preenche a armadilha", async () => {
    const before = await count()
    const response = await post({ ...message, website: "http://spam.test" }, "198.51.100.7")
    expect(response.status).toBe(200)
    expect(await count()).toEqual(before)
  })

  it("valida os campos", async () => {
    expect((await post({ ...message, email: "nao-e-email" }, "198.51.100.8")).status).toBe(400)
    expect((await post({ ...message, message: "curta" }, "198.51.100.8")).status).toBe(400)
    expect((await post({ ...message, extra: 1 }, "198.51.100.8")).status).toBe(400)
  })

  it("limita as mensagens por IP e por hora", async () => {
    const ip = "192.0.2.77"
    for (let i = 0; i < CONTACT_LIMIT_PER_HOUR; i++) expect((await post(message, ip)).status).toBe(200)
    const blocked = await post(message, ip)
    expect(blocked.status).toBe(429)
    expect(((await blocked.json()) as { error: { code: string } }).error.code).toBe("rate_limited")
    // Outro IP não é afetado.
    expect((await post(message, "192.0.2.78")).status).toBe(200)
  })

  it("é pública: não exige sessão", async () => {
    expect(
      (
        await call("/v1/contact", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(message),
        })
      ).status,
    ).toBe(200)
  })
})
