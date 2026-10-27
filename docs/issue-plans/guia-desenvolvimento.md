# Guia de desenvolvimento e qualidade

## Objetivo
Documentar um fluxo repetível de desenvolvimento, revisão, testes e release.

## Escopo
Fixar Node/pnpm, pre-commit, lint, formatação, typecheck, testes unitários/negativos/regressivos, integração, E2E, commits, branches, releases e rollback.

## Testes e aceite
Um clone limpo deve instalar e executar todos os gates; o CI deve falhar em código mal formatado, tipo inválido, teste quebrado ou cobertura abaixo do limite.
