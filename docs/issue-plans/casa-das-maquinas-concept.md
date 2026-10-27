# Backend centralizado e serviços de domínio

## Objetivo
Definir um backend modular para autenticação, catálogo, pedidos, pagamentos, jobs e observabilidade.

## Escopo
Escolher fronteiras de serviço, persistência, filas, webhooks, RBAC e auditoria; documentar quais partes permanecem no Next.js e quais serão migradas para Rust.

## Testes e aceite
Contratos de API, isolamento de tenant, reprocessamento idempotente de webhook, falhas de fila, auditoria de credenciais e testes de segurança precisam ser reproduzíveis.
