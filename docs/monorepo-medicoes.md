# Medições do monorepo

Medidas reais de CI, sem estimativa. Fonte: duração de cada passo do job `quality` (GitHub Actions, `ubuntu-24.04`, Node 22, pnpm 11, cache do pnpm ligado), lida pela API do GitHub.

| Passo                      | Antes: `83d01b1` (#21, app único) | Depois: `219b28d` (`main` com workspace, Worker e E2E) |
| -------------------------- | --------------------------------: | -----------------------------------------------------: |
| `pnpm install --frozen-lockfile` |                              7 s |                                                   13 s |
| `pnpm format:check`        |                               1 s |                                                    3 s |
| `pnpm lint`                |                               3 s |                                                    6 s |
| `pnpm typecheck`           |                               4 s |                                                   11 s |
| `pnpm test:coverage`       |                               1 s |                                                   19 s |
| `pnpm build` (Next)        |                              28 s |                                                   30 s |
| Playwright (instalação)    |                           (não havia) |                                                   24 s |
| E2E de fumaça              |                           (não havia) |                                                   23 s |
| **Total do job**           |                   **cerca de 50 s** |                                       **cerca de 2 min 30 s** |

Run de referência: `41150534706` (antes) e `41163173189` (depois).

## Leitura

- O tempo cresceu porque o escopo cresceu (quatro pacotes, testes do Worker no `workerd`, E2E), não por causa do workspace. Os testes do Worker passam no CI da `main`: eles entram nos 19 s de `test:coverage`.
- O gargalo é o `next build` (30 s) e o E2E (47 s com a instalação do Playwright). Cache de build do Turborepo não atacaria nenhum dos dois de forma relevante com o job inteiro em 2 min 30 s. **Turborepo continua não adotado**; reavaliar se o job passar de 10 min ou se houver mais de um app com build próprio (issue #39).
- **Limites desta medição:** uma execução de cada lado, sem repetição; não separa cache frio de quente (o cache do pnpm estava ligado nos dois); não mede máquina local. Não é um benchmark, é uma ordem de grandeza.

## Rollback do workspace

Não exercitado. O procedimento previsto é reverter os merges #25 e #26 em uma branch descartável e conferir `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck` e `pnpm test`; fica pendente de execução e registro aqui.
