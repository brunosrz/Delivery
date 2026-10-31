# Deploy e GitHub Actions

## Workflows

| Workflow                  | Gatilho                              | O que faz                                                                                        |
| ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `quality.yml`             | PR e push em `main`                  | Formatação, lint, tipos, testes com cobertura, build e E2E de fumaça.                            |
| `codeql.yml`              | PR e push                            | Análise estática de segurança.                                                                   |
| `pr-checks.yml`           | PR                                   | Labels automáticas (`labeler.yml`), título em Conventional Commits e testes dos utilitários.     |
| `pr-release-milestone.yml`| PR (`pull_request_target`)           | Atribui a milestone da linha de release da base e bloqueia combinações incompatíveis.            |
| `release-please.yml`      | push em `main` e `release/**`        | Abre/atualiza a PR de release da linha configurada em `release-lines.json`.                      |
| `rotate-release-lines.yml`| release publicada                    | Ao publicar uma minor, abre a próxima `release/X.Y` e as milestones.                             |
| `forward-port-release.yml`| push em `main` e `release/**`        | Sincroniza `main` (estável) para a minor em desenvolvimento; abre PR se houver conflito.         |
| `deploy.yml`              | push em `main` e manual              | Migrations D1 + Worker da Casa das Máquinas e, depois, o web na Vercel.                          |

## Linhas de release

`.github/release-lines.json` define as duas linhas ativas:

- **maintenance** (`main`, milestone `0.1.x`): patches da série estável. Cada PR contra `main` recebe a milestone `0.1.x`.
- **development** (`release/0.2`, milestone `0.2`): próxima minor. Cada PR contra `release/0.2` recebe a milestone `0.2`.

Ao publicar `v0.2.0`, `rotate-release-lines.yml` abre `release/0.3` e move as milestones; `main` passa a ser a série `0.2.x`.

PRs de release criadas com o `GITHUB_TOKEN` não disparam outros workflows. Para o gate `Quality` rodar sozinho na PR de release (e para o evento `release: published` disparar a rotação), configure o secret `RELEASE_PLEASE_TOKEN` com um token pessoal; sem ele, aprove o gate manualmente na aba Actions.

## Secrets

Em **Settings → Secrets and variables → Actions**. Os de produção ficam no Environment `Production`.

| Secret                                   | Usado em                | Descrição                                                    |
| ---------------------------------------- | ----------------------- | ------------------------------------------------------------ |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | `deploy.yml` (api) | Autenticação do Wrangler (D1 e Workers).                     |
| `D1_DATABASE_ID`                         | `deploy.yml` (api)      | ID do banco D1 de produção, aplicado no `wrangler.jsonc`.    |
| `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | `deploy.yml` (web) | Publicação do `apps/web`. O projeto na Vercel precisa ter *Root Directory* `apps/web`. |
| `RELEASE_PLEASE_TOKEN` (opcional)        | `release-please.yml`    | Token pessoal para que as PRs de release disparem workflows. |

Passos sem secret são pulados, não falham.

## Rollback

- **Worker:** `pnpm exec wrangler rollback` em `apps/casa-das-maquinas`, ou novo deploy a partir do commit anterior (`workflow_dispatch`). Migrations D1 são só aditivas; reverter schema exige uma migration nova.
- **Web:** promova o deploy anterior no painel da Vercel (*Promote to Production*).

## Deploy local

`scons deploy` (ver README) executa os mesmos passos a partir da máquina local, interrompendo na primeira falha.
