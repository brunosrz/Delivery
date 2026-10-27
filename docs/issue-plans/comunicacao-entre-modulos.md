# Comunicação entre módulos

## Objetivo
Padronizar cliente de API, autenticação, erros e eventos entre vitrine, delivery, painel e backend.

## Escopo
Criar envelope de resposta, correlação, timeout, retry limitado, cancelamento e compatibilidade de versões; eliminar chamadas diretas sem contrato.

## Testes e aceite
Testar timeout, payload incompatível, token expirado, tenant errado, retry idempotente e indisponibilidade parcial. Logs devem permitir reconstruir uma requisição sem expor credenciais.
