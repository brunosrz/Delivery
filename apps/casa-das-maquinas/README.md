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

## Desenvolvimento

```bash
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
