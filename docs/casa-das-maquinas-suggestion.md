# Casa das Máquinas: backlog priorizado de melhorias (#5)

Este documento substitui a lista histórica de sugestões. Cada item foi classificado por **risco** e **valor** frente à arquitetura adotada: Cloudflare Workers + D1 + Durable Objects, contratos zod v1 e Better Auth (issues #4, #1, #14). Um item só entra em produção com benchmark comparável quando afetar desempenho, teste negativo e evidência de que o gate falha quando a propriedade é violada.

Legenda de estado: **feito** (com evidência no repositório), **próximo** (já tem fase no plano da #17), **backlog** (aceito, sem data), **rejeitado** (com o motivo registrado).

## Já entregue

| Sugestão original                             | Estado | Evidência                                                                                                                         |
| --------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Ambiente de desenvolvimento local             | feito  | `wrangler dev` com D1 local, migrações e seed sintético; nenhum serviço externo é necessário (`apps/casa-das-maquinas/README.md`) |
| Documentação viva                             | feito  | OpenAPI 3.1 gerada dos schemas em `GET /v1/openapi.json`; os contratos em `packages/contracts` são a fonte de verdade             |
| Análise de segurança contínua                 | feito  | CodeQL em todo PR, actions fixadas por SHA, review automatizado com perfil assertivo                                              |
| Autenticação e auditoria de acesso por tenant | feito  | Better Auth, papéis e `restaurant_members`, com testes negativos de acesso cruzado                                                |
| Organização por domínio (DDD leve)            | feito  | Regras puras em `packages/domain` (preço e máquina de estados), sem dependência de infraestrutura                                 |

## Próximos (com fase na #17)

| Item                                                                      | Valor                                           | Risco                         | Custo | Aceite                                                                                                                                     |
| ------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Pedido idempotente e máquina de estados no Durable Object por restaurante | Alto: é a jornada do produto (#18)              | Alto: dinheiro e concorrência | Médio | Repetir a mesma `Idempotency-Key` não duplica pedido; payload diferente com a mesma chave responde 422; transições inválidas respondem 409 |
| Tempo real por WebSocket Hibernation                                      | Alto: painel do restaurante e app do entregador | Médio                         | Médio | Reconexão retoma pelo último evento; conexões ociosas não consomem duração                                                                 |
| Webhooks de saída para restaurantes                                       | Médio                                           | Médio: reentrega e assinatura | Médio | Assinatura HMAC, reentrega com backoff via Queues e deduplicação no destino                                                                |
| Rate limiting por IP e por usuário                                        | Alto: protege a cota do plano gratuito          | Baixo                         | Baixo | Limite excedido responde 429 no envelope, com teste                                                                                        |
| Canary e rollback                                                         | Alto                                            | Baixo                         | Baixo | Gradual deployments do Workers usados no serviço Rust (#15), com rollback exercitado                                                       |
| Telemetria                                                                | Médio                                           | Baixo                         | Baixo | Workers Observability habilitado; logs JSON com `requestId` em todas as rotas                                                              |

## Backlog (aceito, sem data)

| Item                                                       | Motivo para esperar                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Integração com marketplaces (iFood e afins)                | Depende de contrato comercial e de acesso às APIs dos parceiros                   |
| Login sem senha (magic link)                               | Depende de envio de e-mail transacional; entra junto com a recuperação de senha   |
| Dashboards por tenant                                      | Depende de haver pedidos reais para medir                                         |
| Internacionalização                                        | O foco é o Brasil; strings ficam centralizadas para não bloquear a mudança depois |
| Recomendações, previsão de demanda e análise de sentimento | Exigem volume de dados que a demo não tem; avaliar com dados de produção          |

## Rejeitado

| Sugestão                                          | Decisão           | Motivo                                                                                                                                                                                           |
| ------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| tRPC                                              | rejeitado         | O backend é consumido por três apps e, no futuro, por integrações de terceiros. REST com OpenAPI gerada dos mesmos schemas zod dá tipagem ponta a ponta sem acoplar clientes ao TypeScript       |
| GraphQL complementar                              | rejeitado         | Uma segunda superfície de API duplica autorização e testes sem demanda real de consultas flexíveis                                                                                               |
| Microsserviços graduais                           | rejeitado por ora | Um Worker com Durable Objects já isola o estado por restaurante. Separar serviços só se justifica com medição, e o primeiro caso será o serviço de preço em Rust (#15), atrás de service binding |
| API Gateway dedicado                              | rejeitado         | Roteamento, CORS, rate limiting e autenticação já ficam no Worker e na borda da Cloudflare                                                                                                       |
| Redis / cache distribuído                         | rejeitado por ora | D1 e o cache da borda atendem o volume atual; sem medição de gargalo, cache é estado extra para invalidar                                                                                        |
| Banco híbrido com MongoDB e sharding geográfico   | rejeitado         | D1 replica leitura e o Durable Object por restaurante já particiona a escrita; não há volume que justifique outro banco                                                                          |
| Sistema de plugins                                | rejeitado         | Webhooks de saída cobrem a extensibilidade com muito menos superfície de ataque                                                                                                                  |
| Detecção de fraude por ML e precificação dinâmica | rejeitado por ora | Sem histórico de pedidos, o modelo não teria com o que aprender; regras explícitas vêm primeiro                                                                                                  |
| Chaos engineering e gamificação                   | rejeitado por ora | Fora do escopo do MVP; os testes de falha da #19 cobrem a resiliência necessária                                                                                                                 |
