# Delivery

Plataforma web para catálogos, pedidos e operação de restaurantes. O projeto está em desenvolvimento e serve como base demonstrável para um produto B2B de delivery.

## Desenvolvimento local

Requisitos: Node.js 22 LTS e Bun 1.4.

```bash
bun install
cp .env.example apps/web/.env.local
bun run dev
```

O `bun run build` local exige as variáveis de Supabase e NextAuth listadas em [`.env.example`](.env.example). No CI, o build usa valores dummy e não acessa serviços externos; use valores dummy apenas em testes ou CI.

Estrutura do workspace:

| Pasta                | Conteúdo                                                                               |
| -------------------- | -------------------------------------------------------------------------------------- |
| `apps/web`           | Next.js 15: Delivery Express, Pedidos na Mão, Tá na Entrega, site institucional e MKit |
| `packages/domain`    | Regras puras: totais em centavos e máquina de estados do pedido                        |
| `packages/contracts` | Contratos da API v1 em zod (catálogo, cotação, pedido, identidade e envelope de erro)  |

Validações disponíveis (rodam em todos os pacotes):

```bash
bun run format:check
bun run lint
bun run typecheck
bun run test:coverage
bun run build
bun run e2e
```

O repositório usa Bun como gerenciador de pacotes e executor de scripts (lockfile `bun.lock`); o Node.js 22 segue sendo o runtime de Next.js, Vitest e Playwright. A migração do backend para Rust será conduzida em uma issue própria, com contratos e testes antes de substituir qualquer caminho funcional.

## Automação com SCons

Pré-requisitos: Node 22, Bun 1.4, Python 3.9+ e SCons no PATH (`python -m pip install scons`).
`scons` e `scons -h` mostram a ajuda; `scons -n <alvo>` não executa tarefas.

- `scons install`: instalação com lockfile congelado.
- `scons build`, `scons tests`, `scons coverage`: delegam aos scripts do `package.json`.
- `scons lint`: lint, formatação e tipos; roda todas as etapas e falha se qualquer uma falhar.
- `scons check`: `lint` seguido de `tests`.
- `scons update`: atualiza a raiz e os workspaces. `scons update --latest` (ou só `scons --latest`) ignora os ranges e pode trazer versões major: revise o diff e as breaking changes e rode `scons check` antes de commitar.
- `scons clean`: remove só saídas geradas (build, cobertura, relatórios).
- `scons deploy` (ou `prod`): valida ferramentas, vínculo e autenticação antes de publicar o Worker (se existir) e, depois, a Vercel; qualquer falha interrompe a sequência. Exige `vercel` no PATH, `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID` e `.vercel/project.json` com os mesmos IDs.

`lint` e `tests` nunca instalam dependências. Logs UTF-8 por alvo ficam em `.scons-logs/`.
Testes da automação, sem serviços externos: `python -m unittest discover -s tests -t . -p 'test_scons*.py'`.
