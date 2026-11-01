import { Order, envelope } from "@delivery/contracts"
import { env } from "cloudflare:workers"
import { afterEach, describe, expect, it } from "vitest"
import { MAX_ATTEMPTS, runOutbox } from "../src/jobs"
import { newUser, postJson } from "./helpers"

const orderBody = {
  restaurantId: "rest_burger",
  fulfillment: "pickup",
  items: [{ productId: "prod_bg_classico", quantity: 1, addonOptionIds: ["opt_bg_ponto"] }],
  paymentMethod: "cash",
  expectedTotalCents: 3290,
}

const jobsOf = (orderId: string) =>
  env.DB.prepare(
    "select status, attempts, last_error as lastError, payload from outbox_jobs where order_id = ? order by created_at",
  )
    .bind(orderId)
    .all<{ status: string; attempts: number; lastError: string | null; payload: string }>()
    .then((result) => result.results)

async function insertJob(orderId: string, payload: string, createdAt = "2026-01-01T00:00:00.000Z") {
  await env.DB.prepare(
    "insert into outbox_jobs (id, restaurant_id, order_id, payload, created_at, updated_at) values (?, 'rest_burger', ?, ?, ?, ?)",
  )
    .bind(crypto.randomUUID(), orderId, payload, createdAt, createdAt)
    .run()
}

describe("caixa de saída de eventos", () => {
  // Os testes executam o cron sem idade mínima: o que sobra pendente de um teste não pode contaminar o próximo.
  afterEach(async () => {
    await env.DB.prepare("update outbox_jobs set status = 'done' where status = 'pending'").run()
  })

  it("o pedido grava o job na mesma transação e a publicação imediata o encerra", async () => {
    const { cookie } = await newUser()
    const response = await postJson("/v1/orders", orderBody, {
      cookie,
      "idempotency-key": `chave-${crypto.randomUUID()}`,
    })
    const order = envelope(Order).parse(await response.json()).data as Order

    const jobs = await jobsOf(order.id)
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({ status: "done", attempts: 0 })
    expect(JSON.parse(jobs[0]?.payload ?? "{}")).toMatchObject({
      type: "order.created",
      orderId: order.id,
      status: "pending",
    })
  })

  it("a transição de status grava um job por mudança", async () => {
    const customer = await newUser()
    const staff = await newUser({ staffOf: "rest_burger" })
    const created = await postJson("/v1/orders", orderBody, {
      cookie: customer.cookie,
      "idempotency-key": `chave-${crypto.randomUUID()}`,
    })
    const order = envelope(Order).parse(await created.json()).data as Order
    expect(
      (await postJson(`/v1/orders/${order.id}/transitions`, { to: "accepted" }, { cookie: staff.cookie })).status,
    ).toBe(200)

    const jobs = await jobsOf(order.id)
    expect(jobs.map((job) => JSON.parse(job.payload).status)).toEqual(["pending", "accepted"])
  })

  it("reenvia um job órfão e a sala não duplica o evento", async () => {
    const orderId = `orfao-${crypto.randomUUID()}`
    const payload = { type: "order.updated", orderId, status: "ready", at: "2026-01-01T00:00:00.000Z" }
    await insertJob(orderId, JSON.stringify(payload))

    expect(await runOutbox(env, { minAgeMs: 0 })).toMatchObject({ published: 1, failed: 0, dead: 0 })
    expect((await jobsOf(orderId))[0]?.status).toBe("done")

    // Reenvio do mesmo evento (at-least-once): a sala devolve null em vez de gravar de novo.
    expect(await env.RESTAURANT_ROOM.getByName("rest_burger").publish(payload as never)).toBeNull()
  })

  it("não mexe em job recente (a publicação imediata ainda pode estar em curso)", async () => {
    const orderId = `recente-${crypto.randomUUID()}`
    await insertJob(
      orderId,
      JSON.stringify({ type: "order.created", orderId, status: "pending", at: "x" }),
      new Date().toISOString(),
    )
    const result = await runOutbox(env)
    expect(result.published).toBe(0)
    expect((await jobsOf(orderId))[0]?.status).toBe("pending")
  })

  it("conta tentativas e marca como dead depois do limite, guardando o motivo sem credenciais", async () => {
    const orderId = `quebrado-${crypto.randomUUID()}`
    await insertJob(orderId, "isto não é JSON, token=segredo-no-erro")

    for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
      expect(await runOutbox(env, { minAgeMs: 0, log: () => undefined })).toMatchObject({ failed: 1, dead: 0 })
      expect((await jobsOf(orderId))[0]).toMatchObject({ status: "pending", attempts: attempt })
    }
    expect(await runOutbox(env, { minAgeMs: 0, log: () => undefined })).toMatchObject({ dead: 1 })
    const [job] = await jobsOf(orderId)
    expect(job).toMatchObject({ status: "dead", attempts: MAX_ATTEMPTS })
    expect(job?.lastError).toBeTruthy()
    expect(job?.lastError).not.toContain("segredo-no-erro")

    // Job morto não é reprocessado.
    expect(await runOutbox(env, { minAgeMs: 0, log: () => undefined })).toMatchObject({
      published: 0,
      failed: 0,
      dead: 0,
    })
  })

  it("registra a falha no log com as tentativas gravadas no banco", async () => {
    const orderId = `log-${crypto.randomUUID()}`
    await insertJob(orderId, "payload inválido")
    const lines: string[] = []
    await runOutbox(env, { minAgeMs: 0, log: (line) => lines.push(line) })
    const entries = lines.map((line) => JSON.parse(line)).filter((entry) => entry.orderId === orderId)
    expect(entries).toEqual([expect.objectContaining({ event: "outbox_job_retry", attempts: 1 })])
  })

  it("duas execuções simultâneas publicam o mesmo job uma única vez", async () => {
    const orderId = `duplo-${crypto.randomUUID()}`
    await insertJob(orderId, JSON.stringify({ type: "order.updated", orderId, status: "ready", at: "2026-01-02" }))
    const results = await Promise.all([runOutbox(env, { minAgeMs: 0 }), runOutbox(env, { minAgeMs: 0 })])
    expect(results.reduce((sum, result) => sum + result.published, 0)).toBe(1)
    expect((await jobsOf(orderId))[0]).toMatchObject({ status: "done", attempts: 0 })
  })

  it("duas falhas simultâneas somam as duas tentativas, sem perder contagem", async () => {
    const orderId = `falha-dupla-${crypto.randomUUID()}`
    await insertJob(orderId, "payload inválido")
    const results = await Promise.all([
      runOutbox(env, { minAgeMs: 0, log: () => undefined }),
      runOutbox(env, { minAgeMs: 0, log: () => undefined }),
    ])
    const failed = results.reduce((sum, result) => sum + result.failed, 0)
    const [job] = await jobsOf(orderId)
    expect(job).toMatchObject({ status: "pending", attempts: failed })
    expect(failed).toBeGreaterThanOrEqual(1)
  })

  it("job fechado durante a execução não vira falha nem entra no log", async () => {
    const orderId = `fechado-${crypto.randomUUID()}`
    await insertJob(orderId, "payload inválido")
    const lines: string[] = []
    const [result] = await Promise.all([
      runOutbox(env, { minAgeMs: 0, log: (line) => lines.push(line) }),
      env.DB.prepare("update outbox_jobs set status = 'done' where order_id = ? and status = 'pending'")
        .bind(orderId)
        .run(),
    ])
    const [job] = await jobsOf(orderId)
    const logged = lines.filter((line) => JSON.parse(line).orderId === orderId)
    if (job?.status === "done") {
      // O fechamento venceu: o job continua encerrado e a falha não é contada nem registrada.
      expect(job.attempts).toBe(0)
      expect(logged).toHaveLength(0)
    } else {
      expect(job).toMatchObject({ status: "pending", attempts: 1 })
      expect(logged).toHaveLength(1)
    }
    expect(result.dead).toBe(0)
  })

  it("job que chega ao limite vira dead na mesma instrução e entra no log como dead", async () => {
    const orderId = `limite-${crypto.randomUUID()}`
    await insertJob(orderId, "payload inválido")
    await env.DB.prepare("update outbox_jobs set attempts = ? where order_id = ?")
      .bind(MAX_ATTEMPTS - 1, orderId)
      .run()
    const lines: string[] = []
    expect(await runOutbox(env, { minAgeMs: 0, log: (line) => lines.push(line) })).toMatchObject({ dead: 1 })
    expect((await jobsOf(orderId))[0]).toMatchObject({ status: "dead", attempts: MAX_ATTEMPTS })
    const entries = lines.map((line) => JSON.parse(line)).filter((entry) => entry.orderId === orderId)
    expect(entries).toEqual([expect.objectContaining({ event: "outbox_job_dead", attempts: MAX_ATTEMPTS })])
  })
})
