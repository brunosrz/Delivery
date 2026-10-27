# Delivery

Plataforma web para catálogos, pedidos e operação de restaurantes. O projeto está em desenvolvimento e serve como base demonstrável para um produto B2B de delivery.

## Desenvolvimento local

```bash
pnpm install
pnpm dev
```

Validações disponíveis:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

O repositório usa Node.js e pnpm, mantendo o lockfile existente. A migração do backend para Rust será conduzida em uma issue própria, com contratos e testes antes de substituir qualquer caminho funcional.
