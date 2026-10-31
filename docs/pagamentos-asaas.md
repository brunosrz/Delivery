# Pagamento online com Asaas

Implementação da issue #43. Referência: [documentação do Asaas](https://docs.asaas.com/docs/visao-geral), API v3.

## Métodos de pagamento

| Método no pedido                    | Quando é pago | Cobrança no Asaas                                    |
| ----------------------------------- | ------------- | ---------------------------------------------------- |
| `cash`, `pix_on_delivery`, `card_on_delivery` | Na entrega    | Nenhuma                                              |
| `pix`                               | Online        | `billingType: PIX` + QR Code dinâmico                |
| `card`                              | Online        | Fatura hospedada (`billingType: UNDEFINED`, `invoiceUrl`) com crédito ou débito |

A API do Asaas não aceita cartão de débito: "os dados de cartão de débito não podem ser enviados diretamente pela API". Por isso o cartão (crédito e débito) usa a fatura hospedada do Asaas, o que também mantém dados de cartão fora da Casa das Máquinas (fora do escopo PCI). Não existe campo de cartão no contrato do pedido.

## Fluxo

1. O cliente cria o pedido (`POST /v1/orders`, com `Idempotency-Key`) com `paymentMethod: pix | card` e o `payer` (nome, CPF/CNPJ, e-mail e celular opcionais).
2. O pedido é gravado com pagamento `pending`. Em seguida o Worker garante o cliente no Asaas (`POST /v3/customers`, uma vez por usuário), cria a cobrança (`POST /v3/payments`, `externalReference = id do pedido`) e, no Pix, busca o QR Code (`GET /v3/payments/{id}/pixQrCode`).
3. A resposta traz `charge`: `pix.payload` (copia e cola) e `pix.qrCodeImage` (PNG em Base64) ou `invoiceUrl` para o cartão.
4. O Asaas avisa o pagamento em `POST /v1/webhooks/asaas`. `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED` marcam o pagamento como `paid`.
5. Se o Asaas estiver fora do ar na criação, o pedido fica pendente sem `charge`. O cliente repete em `POST /v1/orders/{orderId}/payment` (o `payer` só é necessário se ainda não houver cliente no Asaas).

## Garantias

- **Sem cobrança duplicada:** o Asaas não tem `Idempotency-Key`. A deduplicação é uma linha única por pedido em `payment_charges` e a busca por `externalReference` antes de criar. Repetir a criação do pedido com a mesma chave não cobra de novo.
- **Webhook idempotente:** a entrega é *at least once*. O `id` do evento é chave primária em `payment_webhook_events`; o UPDATE do pedido é condicional ao status lido e o evento só é registrado se o UPDATE mudou uma linha. Cinco entregas simultâneas do mesmo evento têm um único efeito.
- **Ordem dos eventos:** a máquina de estados do pagamento (`packages/domain/src/payment-status.ts`) aceita `pending→paid|failed`, `failed→paid` e `paid→refunded`. Um estorno antes do pagamento é reconhecido (200) e ignorado.
- **Resposta 200 para o que não é nosso:** cobrança desconhecida, evento sem efeito (visualização da fatura, split etc.) e valor divergente do pedido são registrados e respondidos com 200, para não pausar a fila do Asaas (15 falhas seguidas pausam). Só token inválido (401), corpo inválido (400) e disputa de concorrência (409) geram reenvio.
- **Valor:** o pedido é a fonte da verdade; um evento com valor diferente do total do pedido não altera o pagamento.
- **Limites:** 429 vira `rate_limited` e não é repetido na hora. A API permite 25 mil requisições em 12 h e 50 GET concorrentes.
- **Dados pessoais:** o CPF/CNPJ vai ao Asaas e não é gravado. Guardamos só o `cus_…`. Nenhum log inclui chave, token, CPF ou corpo de requisição.

## Configuração

| Nome                    | Tipo    | Descrição                                                                                  |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `ASAAS_ENV`             | variável | `sandbox` (padrão) ou `production`. Base: `api-sandbox.asaas.com/v3` ou `api.asaas.com/v3`. |
| `ASAAS_API_KEY`         | segredo | Chave de API. Sandbox: `$aact_hmlg_…`; produção: `$aact_prod_…` (uma chave de um ambiente retorna 401 no outro). |
| `ASAAS_WEBHOOK_TOKEN`   | segredo | De 32 a 255 caracteres, sem espaços, diferente da chave de API. É enviado pelo Asaas no header `asaas-access-token`. |

```bash
pnpm exec wrangler secret put ASAAS_API_KEY
pnpm exec wrangler secret put ASAAS_WEBHOOK_TOKEN
node scripts/asaas-register-webhook.mjs https://<worker>/v1/webhooks/asaas contato@exemplo.com
```

O script registra o webhook (`POST /v3/webhooks`, `sendType: SEQUENTIALLY`) com os eventos usados. Sem `ASAAS_API_KEY` o pagamento online responde `unavailable` e os pagamentos na entrega seguem funcionando.

## O que ainda não foi validado

- Os testes automáticos usam o Asaas simulado. **Nenhuma chamada real ao sandbox foi feita**: falta uma conta e uma chave de sandbox. Antes de produção, rodar um pedido Pix e um de cartão no sandbox e conferir o webhook de ponta a ponta.
- A UI de pagamento no checkout (exibir o QR Code e redirecionar para a fatura) pertence ao roadmap #39.
- Reembolso iniciado pelo restaurante, cartão salvo (tokenização) e parcelamento não fazem parte desta entrega.
- A página do Asaas sobre Pix cita `POST /v3/lean/payments`; a referência da API documenta `POST /v3/payments`, que é o usado aqui.
