# Evolução do App Router e limites de módulos

## Objetivo
Consolidar a aplicação atual em módulos claros e preparar migração incremental sem quebrar as jornadas existentes.

## Escopo
Mapear dependências, separar UI de domínio, definir aliases e fronteiras, remover acoplamentos históricos e registrar decisão de monorepo somente após medir o custo real.

## Testes e aceite
Smoke tests das rotas públicas, regressão de navegação, build limpo e teste negativo para imports proibidos. A migração só é aceita com plano reversível e evidência de paridade.
