# Catálogo de aplicações

Este documento lista as aplicações do ecossistema, onde cada uma vive no repositório hoje e onde será publicada. O estado de cada módulo (implementado, parcial, demonstração, em construção ou planejado) é mantido junto ao código e verificado por teste.

## Estrutura atual

O repositório é **uma única aplicação Next.js 15 (App Router)** com um único build (`pnpm build`). Cada produto é uma rota de primeiro nível em `app/`. Não existem `apps/*` nem pacotes compartilhados publicados; a separação em monorepo é um plano futuro (issues #11 e #13).

| Produto | Público | Rota atual | Observação |
| --- | --- | --- | --- |
| Site institucional | Público | `app/site-institucional` | Página de apresentação; contato ainda não existe |
| Delivery Express | Cliente | `app/delivery-express` | Catálogo lido do Supabase; sem carrinho nem pedido persistidos |
| Pedidos na Mão | Restaurante | `app/pedidos-na-mao` | Lista de funcionalidades planejadas |
| Tá na Entrega | Entregador | `app/ta-na-entrega` | Lista de funcionalidades planejadas |
| MKit | Restaurante | `app/mkit` | Conteúdo estático do conceito |
| Casa das Máquinas | Backend | `app/casa-das-maquinas` | Página de arquitetura; a API ainda não existe |

Observabilidade e operação ficam fora do produto (Grafana, métricas e logs externos) e não têm rota própria.

## Hospedagem planejada

| Projeto | Hospedagem | Forma |
| --- | --- | --- |
| Site institucional, Delivery Express, Pedidos na Mão, Tá na Entrega e MKit | Vercel, como uma única aplicação Next.js | Web responsivo; Pedidos na Mão e Tá na Entrega como PWA instalável |
| Casa das Máquinas | Cloudflare Workers com D1 e Durable Objects | API v1 e WebSocket |
| Serviço de preço em Rust (#15) | Cloudflare Workers (workers-rs), acesso interno | Sem endereço público |

## Desenvolvimento local

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Todos os produtos ficam acessíveis em `http://localhost:3000/<rota>`; não há gateway por subdomínio.

## Deploy por ambiente

Hoje o repositório é uma única aplicação Next.js com um único build (`pnpm build`); não existe deploy automatizado. O deploy independente por aplicação é um plano futuro, condicionado à migração para monorepo (issues #11 e #13). Quando existir, a configuração precisa ser versionada no CI e não depender de arquivos gerados por plataforma.
