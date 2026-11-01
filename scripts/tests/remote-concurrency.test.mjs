import assert from "node:assert/strict"
import { createServer } from "node:http"
import { describe, it } from "node:test"
import { runConcurrency } from "../../apps/casa-das-maquinas/scripts/remote-concurrency.mjs"

// API falsa com a semântica correta (idempotência e transição condicional) e uma com defeito deliberado,
// para provar que o script de concorrência detecta duplicação.
function fakeApi({ broken }) {
  const orders = new Map()
  const byKey = new Map()
  return createServer((request, response) => {
    let raw = ""
    request.on("data", (chunk) => (raw += chunk))
    request.on("end", () => {
      const send = (status, data) => {
        response.writeHead(status, { "content-type": "application/json" })
        response.end(JSON.stringify({ data, error: null }))
      }
      const url = new URL(request.url ?? "/", "http://x")
      if (request.method === "POST" && url.pathname === "/v1/orders") {
        const key = request.headers["idempotency-key"]
        if (!broken && byKey.has(key)) return send(200, byKey.get(key))
        const order = { id: `ord_${orders.size + 1}`, status: "pending", timeline: [{ status: "pending" }] }
        orders.set(order.id, order)
        byKey.set(key, order)
        return send(201, order)
      }
      const transition = url.pathname.match(/^\/v1\/orders\/([^/]+)\/transitions$/)
      if (transition && request.method === "POST") {
        const order = orders.get(transition[1])
        if (!broken && order.status === "accepted") return send(409, null)
        order.status = "accepted"
        order.timeline.push({ status: "accepted" })
        return send(200, order)
      }
      const read = url.pathname.match(/^\/v1\/orders\/([^/]+)$/)
      if (read) return send(200, orders.get(read[1]))
      send(404, null)
    })
  })
}

async function withServer(options, run) {
  const server = fakeApi(options)
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  try {
    return await run(`http://127.0.0.1:${server.address().port}`)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

const config = (baseUrl) => ({
  baseUrl,
  customerCookie: "c=1",
  staffCookie: "s=1",
  restaurantId: "r1",
  productId: "p1",
  expectedTotalCents: 1000,
  n: 8,
})

describe("runConcurrency", () => {
  it("aprova uma API idempotente: um pedido, um 201 e uma transição vencedora", async () => {
    const result = await withServer({ broken: false }, (baseUrl) => runConcurrency(config(baseUrl)))
    assert.equal(result.ok, true, result.findings.join("; "))
    assert.equal(result.created, 1)
    assert.equal(result.accepted, 1)
  })

  it("detecta duplicação quando a idempotência falha", async () => {
    const result = await withServer({ broken: true }, (baseUrl) => runConcurrency(config(baseUrl)))
    assert.equal(result.ok, false)
    assert.match(result.findings.join("\n"), /criação: esperado 1 pedido/)
  })
})
