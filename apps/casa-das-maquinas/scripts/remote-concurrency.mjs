// Prova, contra uma API REAL (staging ou produção com restaurante de teste), que a concorrência não duplica efeitos:
//  1. N criações paralelas de pedido com a MESMA Idempotency-Key resultam em um único pedido;
//  2. N transições paralelas do mesmo pedido para o mesmo status têm uma única vencedora.
// Observação: o D1 serializa as escritas de um banco; isto valida a idempotência e as condições de corrida da
// aplicação, não paralelismo de escrita do banco.
//
// Uso:
//   API_URL=https://... CUSTOMER_COOKIE='better-auth.session_token=...' STAFF_COOKIE='...' \
//   RESTAURANT_ID=... PRODUCT_ID=... EXPECTED_TOTAL_CENTS=... node scripts/remote-concurrency.mjs [N]
// Os cookies vêm de contas de TESTE; nunca registre o valor deles em logs ou no repositório.

import process from "node:process"
import { URL, pathToFileURL } from "node:url"

const call = async (baseUrl, path, { cookie, key, body, method = "POST" }) => {
  const response = await globalThis.fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      cookie,
      ...(key ? { "idempotency-key": key } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return { status: response.status, body: await response.json().catch(() => null) }
}

export async function runConcurrency({
  baseUrl,
  customerCookie,
  staffCookie,
  restaurantId,
  productId,
  expectedTotalCents,
  address,
  n = 10,
}) {
  const findings = []
  const orderBody = {
    restaurantId,
    fulfillment: address ? "delivery" : "pickup",
    items: [{ productId, quantity: 1, addonOptionIds: [] }],
    paymentMethod: "cash",
    expectedTotalCents,
    ...(address ? { address } : {}),
  }
  const key = `concorrencia-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  const creations = await Promise.all(
    Array.from({ length: n }, () => call(baseUrl, "/v1/orders", { cookie: customerCookie, key, body: orderBody })),
  )
  const ids = new Set(creations.filter((r) => r.status === 200 || r.status === 201).map((r) => r.body?.data?.id))
  const created = creations.filter((r) => r.status === 201).length
  if (ids.size !== 1) findings.push(`criação: esperado 1 pedido, vieram ${ids.size}`)
  if (created !== 1) findings.push(`criação: esperado exatamente um 201, vieram ${created}`)
  const unexpected = creations.filter((r) => ![200, 201].includes(r.status)).map((r) => r.status)
  if (unexpected.length > 0) findings.push(`criação: status inesperados ${[...new Set(unexpected)].join(",")}`)

  const [orderId] = [...ids]
  let accepted = 0
  if (orderId) {
    const transitions = await Promise.all(
      Array.from({ length: n }, () =>
        call(baseUrl, `/v1/orders/${orderId}/transitions`, { cookie: staffCookie, body: { to: "accepted" } }),
      ),
    )
    accepted = transitions.filter((r) => r.status === 200).length
    if (accepted !== 1) findings.push(`transição: esperada 1 vencedora, vieram ${accepted}`)
    const bad = transitions.filter((r) => ![200, 409].includes(r.status)).map((r) => r.status)
    if (bad.length > 0) findings.push(`transição: status inesperados ${[...new Set(bad)].join(",")}`)

    const order = await call(baseUrl, `/v1/orders/${orderId}`, { cookie: customerCookie, method: "GET" })
    const timeline = order.body?.data?.timeline ?? []
    if (timeline.filter((event) => event.status === "accepted").length !== 1) {
      findings.push("linha do tempo: o status accepted deveria aparecer uma vez")
    }
  }

  return { ok: findings.length === 0, orderId: orderId ?? null, created, accepted, findings }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const env = process.env
  const required = ["API_URL", "CUSTOMER_COOKIE", "STAFF_COOKIE", "RESTAURANT_ID", "PRODUCT_ID", "EXPECTED_TOTAL_CENTS"]
  const missing = required.filter((name) => !env[name])
  if (missing.length > 0) {
    process.stderr.write(`Faltam variáveis: ${missing.join(", ")}\n`)
    process.exit(2)
  }
  const result = await runConcurrency({
    baseUrl: env.API_URL,
    customerCookie: env.CUSTOMER_COOKIE,
    staffCookie: env.STAFF_COOKIE,
    restaurantId: env.RESTAURANT_ID,
    productId: env.PRODUCT_ID,
    expectedTotalCents: Number(env.EXPECTED_TOTAL_CENTS),
    n: Number(process.argv[2] ?? 10),
  })
  process.stdout.write(`${JSON.stringify({ ...result, api: new URL(env.API_URL).host }, null, 2)}\n`)
  process.exit(result.ok ? 0 : 1)
}
