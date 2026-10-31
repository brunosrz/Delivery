import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { call } from "./helpers"

describe("OpenAPI publicado", () => {
  it("é igual ao snapshot versionado em packages/contracts/openapi/v1.json", async () => {
    const served = await (await call("/v1/openapi.json")).json()
    // Falhou? Rota ou schema mudou: rode `pnpm --filter @delivery/casa-das-maquinas openapi:export` e versione o resultado.
    expect(served).toEqual(JSON.parse(env.OPENAPI_SNAPSHOT))
  })

  it("publica as rotas de pedido, pagamento e cotação", async () => {
    const doc = (await (await call("/v1/openapi.json")).json()) as { paths: Record<string, unknown> }
    expect(Object.keys(doc.paths)).toEqual(
      expect.arrayContaining(["/v1/quotes", "/v1/orders", "/v1/orders/{orderId}/payment"]),
    )
  })
})
