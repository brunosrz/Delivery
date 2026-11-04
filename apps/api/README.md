# API Delivery

Backend centralizado do ecossistema Delivery Express: API v1 em Cloudflare Workers com [Hono](https://hono.dev), banco [D1](https://developers.cloudflare.com/d1/) e contratos de [`@delivery/contracts`](../../packages/contracts). A API usa recursos Cloudflare próprios do Delivery e não compartilha banco, Worker, R2 ou KV com o ERP/PDV.

## Rotas

| Rota                              | Descrição                                   |
| --------------------------------- | ------------------------------------------- |
| `GET /v1/health`                  | Worker ativo e banco acessível              |
| `GET /v1/restaurants`             | Restaurantes por prioridade                 |
| `GET /v1/restaurants/{slug}/menu` | Cardápio completo, isolado pelo restaurante |
| `GET /v1/openapi.json`            | OpenAPI 3.1 gerada dos schemas              |

Toda resposta usa o envelope `{ data, error, meta: { requestId, apiVersion } }`. O header `X-Request-Id` é propagado quando válido, ou gerado.

## Autenticação e tenant

- O papel nunca vem do cliente: todo cadastro nasce `customer`. Equipe de restaurante é o papel `restaurant_staff` mais um vínculo em `restaurant_members`.
- `canManageRestaurant` é a única regra de acesso a dados de gestão. A autorização acontece antes da consulta, para quem não gere o restaurante não descobrir se ele existe.
- O app web expõe `/api/auth/*` como proxy para cá, então o cookie de sessão é do próprio site. `BETTER_AUTH_URL` deve ser a origem pública do app web, e `TRUSTED_ORIGINS` lista as origens aceitas. Os hosts planejados são `delivery.brunosrz.com`, `entregador.brunosrz.com`, `institucional.brunosrz.com` e `pedidos.brunosrz.com`; DNS e publicação dos apps não fazem parte desta configuração de infra.
- Segredos: `BETTER_AUTH_SECRET` (obrigatório) e `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (opcionais), via `wrangler secret put` em produção e `.dev.vars` localmente (veja `.dev.vars.example`).
- Pagamento online (Asaas): `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` (segredos) e `ASAAS_ENV` (`sandbox` por padrão). Sem a chave, só os pagamentos na entrega funcionam. Configuração, fluxo e webhook em [`docs/pagamentos-asaas.md`](../../docs/pagamentos-asaas.md); o script `scripts/asaas-register-webhook.mjs` cadastra o webhook no Asaas.

## Tempo real

Cada restaurante tem um Durable Object `RestaurantRoom` (SQLite + WebSocket Hibernation):

- grava cada evento numerado (`seq`) antes de distribuir e guarda os 500 mais recentes;
- sockets da equipe (escopo restaurante) recebem tudo; sockets de cliente (escopo pedido) recebem só o próprio pedido;
- `ping` é respondido com `pong` sem acordar o objeto, e conexões ociosas não consomem duração;
- o browser não envia o cookie do site ao domínio do Worker, então o app web pede um ticket assinado (HMAC, 60 s) no servidor e o repassa ao cliente.

Uma falha ao publicar no tempo real é registrada no log e não desfaz o pedido gravado no D1.

## Desenvolvimento

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars
bun run --filter @delivery/api db:migrate:local
(cd apps/api && bunx wrangler d1 execute DB --local --file seed/demo.sql)
bun run --filter @delivery/api dev
```

- `bun run db:generate` gera uma nova migração a partir de `src/db/schema.ts`; nunca edite migrações já aplicadas.
- `bun run cf-typegen` regenera os tipos do `Env` depois de mudar o `wrangler.jsonc`.
- `bun run test` roda os testes no runtime `workerd`. Cada arquivo de teste recebe um D1 isolado, com as migrações e o seed sintético aplicados.

## Infraestrutura e deploy

O Worker é nomeado `delivery-api` e tem o ambiente `delivery-api-preview`. Cada ambiente usa D1, R2 e KV exclusivos do Delivery, além do Durable Object `RestaurantRoom`. Veja [Deploy e ambientes Cloudflare](../../.github/DEPLOYMENT.md) para IDs, domínios planejados e instruções.

O workflow `.github/workflows/deploy.yml` executa testes, aplica migrations no D1 do ambiente e publica somente este Worker. PRs publicam Preview; push em `main` publica Production. `apps/web` não é publicado por esse workflow.

O seed de demonstração não roda automaticamente em produção; aplique-o manualmente com `wrangler d1 execute DB --remote --file seed/demo.sql`.

## Dados pessoais (LGPD)

- `GET /v1/me/export`: cópia dos dados do titular (conta e **todos** os pedidos, sem o limite de 50 da listagem comum). Nunca inclui hash de senha, tokens ou sessões.
- `DELETE /v1/me` com `{"confirm": "EXCLUIR MINHA CONTA"}`: anonimiza a conta do cliente em um único lote. O pedido é mantido (obrigação fiscal e financeira, art. 16); em pedidos de entrega o endereço vira um valor fixo (`Endereço removido`, CEP `00000-000`) para o pedido continuar válido no schema `Order`. Sessões, credenciais, o vínculo local com o cadastro de cobrança e as verificações (inclusive tokens de redefinição de senha) são apagados e o e-mail vira `excluido-<id>@invalid.local`. Recusa com `409` se houver pedido em andamento e com `403` fora de contas de cliente (equipe, entregador e admin saem pelo administrador).

**Asaas:** o cadastro do cliente no Asaas (nome, CPF/CNPJ e contato informados no pagamento) **não é removido** pela API: fica retido como registro de cobrança, com prazo definido pelas obrigações fiscais e financeiras. Só o vínculo local é apagado. Se a política exigir a remoção remota, é preciso uma operação própria com o cliente Asaas, tratada antes da anonimização local.

Ainda não há tela no app web para administrar a suspensão e restauração de restaurantes. A API permite que a administração suspenda um restaurante e o restaure em até 30 dias; veja [Exclusão recuperável de restaurante](#exclusão-recuperável-de-restaurante).

## Limite de requisições

Janela fixa de 1 minuto, contada no D1 (`rate_limit_buckets`) com um único `INSERT ... ON CONFLICT ... RETURNING`, então simultâneas não furam o limite. A identidade é o usuário da sessão ou, sem sessão, o IP (hash salgado; o IP nunca é gravado). Acima da cota a API responde `429` com `Retry-After` em segundos e o envelope `rate_limited`. Se o D1 falhar, a requisição passa. O cron apaga janelas com mais de 24 h.

| Rota (POST)                      | Cota/min | Por      |
| -------------------------------- | -------- | -------- |
| `/api/auth/*`                    | 20       | IP       |
| `/v1/quotes`                     | 60       | IP       |
| `/v1/orders`                     | 15       | usuário  |
| `/v1/orders/:id/payment`         | 10       | usuário  |
| `/v1/orders/:id/transitions`     | 120      | usuário  |
| `/v1/live/tickets`               | 30       | usuário  |
| `/v1/admin/restaurants/:id/suspend` | 10       | usuário  |
| `/v1/admin/restaurants/:id/restore` | 10       | usuário  |

O formulário de contato mantém o limite próprio por hora (`src/contact.ts`).

## MKit: categorias, calendário, geração e lixeira

Rotas sob `/v1/manage/restaurants/:id/mkit` (equipe do restaurante ou admin): `categories` (GET, POST, DELETE `:categoryId`), `calendar` (GET, POST, DELETE `:eventId`), `materials/generate` (POST), `materials/:id/restore` (POST), `materials?lixeira=1` (GET) e `materials/:id?definitivo=1` (DELETE, só na lixeira). Veja `docs/mkit.md` para o mapa completo da issue #12.

## MKit: métricas

`GET /v1/manage/restaurants/:id/mkit/metrics` (equipe do restaurante ou admin) devolve o total de materiais, publicados e rascunhos, a divisão por tipo, o total de exportações e os cinco materiais mais exportados. Cada exportação (`.txt`, imagem ou PDF) soma 1 em `exportCount` pelo endpoint de exportação; imagem e PDF são gerados no navegador (`apps/web/lib/mkit-render.ts`), sem dependência nova.

## Exclusão recuperável de restaurante

Só a administração (`POST /v1/admin/restaurants/:id/suspend` e `/restore`). Suspender esconde o restaurante do catálogo, recusa cotação e pedido novo, tira a equipe da gestão, dos pedidos e do tempo real (403) e cancela os jobs pendentes da caixa de saída; a administração continua enxergando para poder resolver o que ficou aberto ou restaurar. Em até 30 dias `restore` desfaz tudo (menos os jobs já cancelados). Depois disso o cron (`purgeSuspendedTenants`) remove cardápio, horários, MKit e vínculos da equipe, limpa o histórico do objeto durável e grava `purged_at`; os **pedidos ficam** (obrigação fiscal e financeira) e restaurar passa a dar 409. Cada etapa pode ser repetida: se o objeto durável falhar, o próximo ciclo tenta de novo.
