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
pnpm --filter @delivery/casa-das-maquinas db:migrate:local
pnpm --filter @delivery/casa-das-maquinas exec wrangler d1 execute DB --local --file seed/demo.sql
pnpm --filter @delivery/casa-das-maquinas dev
```

- `pnpm db:generate` gera uma nova migração a partir de `src/db/schema.ts`; nunca edite migrações já aplicadas.
- `pnpm cf-typegen` regenera os tipos do `Env` depois de mudar o `wrangler.jsonc`.
- `pnpm test` roda os testes no runtime `workerd`. Cada arquivo de teste recebe um D1 isolado, com as migrações e o seed sintético aplicados.

## Deploy

O workflow `Deploy Casa das Máquinas` publica na `main` quando os secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` e `D1_DATABASE_ID` existem. A ordem é: testes, migrações remotas e deploy. Sem os secrets, o job registra que o deploy foi pulado.

O seed de demonstração não roda automaticamente em produção; aplique-o manualmente com `wrangler d1 execute DB --remote --file seed/demo.sql`.
