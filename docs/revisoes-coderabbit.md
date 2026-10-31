# Revisões do CodeRabbit: rastreamento

Só entram achados que foram lidos nas threads do GitHub (inline, não resolvidas em 2026-10-30). Revisões dos PRs #24, #26, #28, #30 e #37 não tinham thread inline aberta; os comentários só do corpo da revisão não foram lidos e **não** estão rastreados aqui. Resolução nunca é inferida pelo merge.

| PR  | Achado                                                          | Ação                                              | Evidência                                        | Status        |
| --- | --------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------ | ------------- |
| #25 | `Order` de entrega aceitava `address: null`                     | Refinamento em `Order`                            | `packages/contracts/tests/contracts.test.ts`     | Feito         |
| #25 | Preço enviado dentro de `items` era descartado                  | `CartItemInput` e `Address` com `.strict()`        | `packages/contracts/tests/contracts.test.ts`     | Feito         |
| #25 | Grupo com `minSelections` impossível passava                    | `minSelections <= options.length` no schema; produto indisponível no catálogo se as opções disponíveis não bastam | `contracts.test.ts`, `src/repositories/catalog.ts` | Feito (teste do catálogo roda só no CI) |
| #25 | Script `start` removido da raiz                                 | `start` restaurado                                | `package.json`                                   | Feito         |
| #25 | Imports `.js` dos pacotes no webpack (`extensionAlias`)         | —                                                 | —                                                | Pendente      |
| #25 | `docs/estrutura-atual.md:3`, `docs/api-reference.md:9`, `README.md:25` | `api-reference.md` marcado como histórico   | `docs/api-reference.md`                          | Parcial       |
| #27 | `Retry-After` e comentário sobre 5xx no cliente                 | Cliente respeita `Retry-After` (com teto) e cita 502/503/504 | `packages/contracts/tests/client-orders.test.ts` | Feito |
| #34 | 19 comentários de documentação                                  | Guia de desenvolvimento corrigido                 | `docs/guia-desenvolvimento.md`                   | Parcial (demais docs pendentes) |
