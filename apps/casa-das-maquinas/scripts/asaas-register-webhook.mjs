// Registra (ou atualiza) o webhook de pagamentos no Asaas: POST /v3/webhooks.
// Uso:
//   ASAAS_API_KEY=... ASAAS_WEBHOOK_TOKEN=... ASAAS_ENV=sandbox \
//   node scripts/asaas-register-webhook.mjs https://sua-api.workers.dev/v1/webhooks/asaas contato@exemplo.com
// O token (32 a 255 caracteres, sem espaços) precisa ser o mesmo configurado como segredo no Worker.

import process from "node:process"

const BASE_URL = {
  sandbox: "https://api-sandbox.asaas.com/v3",
  production: "https://api.asaas.com/v3",
}

const fail = (message, code = 2) => {
  process.stderr.write(`${message}
`)
  process.exit(code)
}

const [url, email] = process.argv.slice(2)
const { ASAAS_API_KEY: apiKey, ASAAS_WEBHOOK_TOKEN: authToken, ASAAS_ENV: environment = "sandbox" } = process.env

if (!url || !email || !apiKey || !authToken) {
  fail("Uso: ASAAS_API_KEY=... ASAAS_WEBHOOK_TOKEN=... node scripts/asaas-register-webhook.mjs <url> <email>")
}
if (!(environment in BASE_URL)) {
  fail("ASAAS_ENV deve ser sandbox ou production")
}
if (authToken.length < 32 || authToken.length > 255 || /\s/.test(authToken)) {
  fail("ASAAS_WEBHOOK_TOKEN deve ter de 32 a 255 caracteres e nenhum espaço")
}
if (environment === "production" && !apiKey.startsWith("$aact_prod_")) {
  fail("Em produção a chave deve começar com $aact_prod_")
}

const response = await globalThis.fetch(`${BASE_URL[environment]}/webhooks`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    access_token: apiKey,
    "user-agent": "delivery-casa-das-maquinas",
  },
  body: JSON.stringify({
    name: "Delivery - pagamentos",
    url,
    email,
    enabled: true,
    interrupted: false,
    apiVersion: 3,
    authToken,
    // Preserva a ordem dos eventos; o Worker é idempotente por id de evento.
    sendType: "SEQUENTIALLY",
    events: [
      "PAYMENT_CONFIRMED",
      "PAYMENT_RECEIVED",
      "PAYMENT_OVERDUE",
      "PAYMENT_DELETED",
      "PAYMENT_REFUNDED",
      "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED",
      "PAYMENT_REPROVED_BY_RISK_ANALYSIS",
    ],
  }),
})

// Nunca imprime o corpo da resposta: ele devolve o authToken.
if (!response.ok) {
  fail(`Falha ao registrar o webhook: HTTP ${response.status}`, 1)
}
const { id } = await response.json()
process.stdout.write(`Webhook registrado (${environment}): ${id}
`)
