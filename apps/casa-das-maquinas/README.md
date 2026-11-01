# Casa das Máquinas

Backend centralizado do ecossistema Delivery Express: API v1 em Cloudflare Workers com [Hono](https://hono.dev), banco [D1](https://developers.cloudflare.com/d1/) e contratos de [`@delivery/contracts`](../../packages/contracts).

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
- O app web expõe `/api/auth/*` como proxy para cá, então o cookie de sessão é do próprio site. `BETTER_AUTH_URL` deve ser a origem pública do app web, e `TRUSTED_ORIGINS` lista as origens aceitas.
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
cp apps/casa-das-maquinas/.dev.vars.example apps/casa-das-maquinas/.dev.vars
bun run --filter @delivery/casa-das-maquinas db:migrate:local
(cd apps/casa-das-maquinas && bunx wrangler d1 execute DB --local --file seed/demo.sql)
bun run --filter @delivery/casa-das-maquinas dev
```

- `bun run db:generate` gera uma nova migração a partir de `src/db/schema.ts`; nunca edite migrações já aplicadas.
- `bun run cf-typegen` regenera os tipos do `Env` depois de mudar o `wrangler.jsonc`.
- `bun run test` roda os testes no runtime `workerd`. Cada arquivo de teste recebe um D1 isolado, com as migrações e o seed sintético aplicados.

## Deploy

O workflow `Deploy Casa das Máquinas` publica na `main` quando os secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` e `D1_DATABASE_ID` existem. A ordem é: testes, migrações remotas e deploy. Sem os secrets, o job registra que o deploy foi pulado.

O seed de demonstração não roda automaticamente em produção; aplique-o manualmente com `wrangler d1 execute DB --remote --file seed/demo.sql`.

## Dados pessoais (LGPD)

- `GET /v1/me/export`: cópia dos dados do titular (conta e **todos** os pedidos, sem o limite de 50 da listagem comum). Nunca inclui hash de senha, tokens ou sessões.
- `DELETE /v1/me` com `{"confirm": "EXCLUIR MINHA CONTA"}`: anonimiza a conta do cliente em um único lote. O pedido é mantido (obrigação fiscal e financeira, art. 16); em pedidos de entrega o endereço vira um valor fixo (`Endereço removido`, CEP `00000-000`) para o pedido continuar válido no schema `Order`. Sessões, credenciais, o vínculo local com o cadastro de cobrança e as verificações (inclusive tokens de redefinição de senha) são apagados e o e-mail vira `excluido-<id>@invalid.local`. Recusa com `409` se houver pedido em andamento e com `403` fora de contas de cliente (equipe, entregador e admin saem pelo administrador).

**Asaas:** o cadastro do cliente no Asaas (nome, CPF/CNPJ e contato informados no pagamento) **não é removido** pela API: fica retido como registro de cobrança, com prazo definido pelas obrigações fiscais e financeiras. Só o vínculo local é apagado. Se a política exigir a remoção remota, é preciso uma operação própria com o cliente Asaas, tratada antes da anonimização local.

Ainda não há tela no app web nem exclusão de tenant (restaurante): ficam como roadmap da #39.

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

O formulário de contato mantém o limite próprio por hora (`src/contact.ts`).
