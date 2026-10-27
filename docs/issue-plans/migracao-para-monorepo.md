# Migração controlada para monorepo

## Objetivo
Avaliar e executar a migração somente quando os limites de domínio e automação estiverem comprovados.

## Escopo
Definir workspace, packages, ownership, cache, CI, versionamento e rollback. Migrar um módulo por vez mantendo os caminhos antigos em paralelo.

## Testes e aceite
Comparar builds, testes, tempos e artefatos antes/depois; testar imports cruzados proibidos e rollback de uma migração parcial.
