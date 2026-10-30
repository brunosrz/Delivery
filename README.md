# Delivery

Plataforma web para catálogos, pedidos e operação de restaurantes. O projeto está em desenvolvimento e serve como base demonstrável para um produto B2B de delivery.

## Desenvolvimento local

Requisitos: Node.js 22 LTS e pnpm 11.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

O `pnpm build` local exige as variáveis de Supabase e NextAuth listadas em [`.env.example`](.env.example). No CI, o build usa valores dummy e não acessa serviços externos; use valores dummy apenas em testes ou CI.

Validações disponíveis:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

O repositório usa Node.js e pnpm, mantendo o lockfile existente. A migração do backend para Rust será conduzida em uma issue própria, com contratos e testes antes de substituir qualquer caminho funcional.
