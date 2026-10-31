# Delivery

Plataforma web para catálogos, pedidos e operação de restaurantes. O projeto está em desenvolvimento e serve como base demonstrável para um produto B2B de delivery.

## Desenvolvimento local

Requisitos: Node.js 22 LTS e pnpm 11.

```bash
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

O `pnpm build` local exige as variáveis de Supabase e NextAuth listadas em [`.env.example`](.env.example). No CI, o build usa valores dummy e não acessa serviços externos; use valores dummy apenas em testes ou CI.

Estrutura do workspace:

| Pasta                | Conteúdo                                                                               |
| -------------------- | -------------------------------------------------------------------------------------- |
| `apps/web`           | Next.js 15: Delivery Express, Pedidos na Mão, Tá na Entrega, site institucional e MKit |
| `packages/domain`    | Regras puras: totais em centavos e máquina de estados do pedido                        |
| `packages/contracts` | Contratos da API v1 em zod (catálogo, cotação, pedido, identidade e envelope de erro)  |

Validações disponíveis (rodam em todos os pacotes):

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm e2e
```

O repositório usa Node.js e pnpm, mantendo o lockfile existente. A migração do backend para Rust será conduzida em uma issue própria, com contratos e testes antes de substituir qualquer caminho funcional.
