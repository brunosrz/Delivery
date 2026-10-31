# Catálogo de aplicações

Este documento lista as aplicações do ecossistema, onde cada uma vive no repositório hoje e onde será publicada. O estado de cada módulo (implementado, parcial, demonstração, em construção ou planejado) é mantido junto ao código e verificado por teste.

## Estrutura atual

O repositório é um **workspace pnpm**. Os frontends são uma única aplicação Next.js 15 (App Router) em `apps/web`, com um único build e uma rota de primeiro nível por produto. As regras puras ficam em `packages/domain` (totais em centavos e máquina de estados do pedido) e os contratos da API v1 em `packages/contracts` (schemas zod). O backend da Casa das Máquinas entra em `apps/casa-das-maquinas` na Fase 2 (issue #4).

| Produto            | Público     | Rota atual                        | Observação                                                               |
| ------------------ | ----------- | --------------------------------- | ------------------------------------------------------------------------ |
| Site institucional | Público     | `apps/web/app/site-institucional` | Página de apresentação; contato ainda não existe                         |
| Delivery Express   | Cliente     | `apps/web/app/delivery-express`   | Catálogo via API da Casa das Máquinas; sem sacola nem pedido persistidos |
| Pedidos na Mão     | Restaurante | `apps/web/app/pedidos-na-mao`     | Lista de funcionalidades planejadas                                      |
| Tá na Entrega      | Entregador  | `apps/web/app/ta-na-entrega`      | Lista de funcionalidades planejadas                                      |
| MKit               | Restaurante | `apps/web/app/mkit`               | Conteúdo estático do conceito                                            |
| Casa das Máquinas  | Backend     | `apps/web/app/casa-das-maquinas`  | Página de arquitetura; a API vive em `apps/casa-das-maquinas`            |

Observabilidade e operação ficam fora do produto (Grafana, métricas e logs externos) e não têm rota própria.

## Hospedagem planejada

| Projeto                                                                    | Hospedagem                                      | Forma                                                              |
| -------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| Site institucional, Delivery Express, Pedidos na Mão, Tá na Entrega e MKit | Vercel, como uma única aplicação Next.js        | Web responsivo; Pedidos na Mão e Tá na Entrega como PWA instalável |
| Casa das Máquinas                                                          | Cloudflare Workers com D1 e Durable Objects     | API v1 e WebSocket                                                 |
| Serviço de preço em Rust (#15)                                             | Cloudflare Workers (workers-rs), acesso interno | Sem endereço público                                               |

## Desenvolvimento local

```bash
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

Todos os produtos ficam acessíveis em `http://localhost:3000/<rota>`; não há gateway por subdomínio.

## Deploy por ambiente

Hoje só existe um app publicável (`apps/web`, `pnpm build`) e não há deploy automatizado. O deploy independente de cada app do workspace (web na Vercel, Casa das Máquinas na Cloudflare) entra com a Fase 2 (issues #4, #11 e #13). Quando existir, a configuração precisa ser versionada no CI e não depender de arquivos gerados por plataforma.
