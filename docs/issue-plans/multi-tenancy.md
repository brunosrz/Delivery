# Isolamento multi-tenant

## Objetivo
Garantir que dados, configurações, domínio, cache, jobs e auditoria de um restaurante nunca vazem para outro.

## Escopo
Definir identificação, middleware, modelo de dados, autorização, personalização, domínios, cache, storage, observabilidade e retenção.

## Testes e aceite
Testes negativos de acesso cruzado, IDs forjados, cache compartilhado, jobs órfãos, exportação e domínio; testes de concorrência e recuperação devem provar isolamento.
