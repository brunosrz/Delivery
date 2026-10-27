# API: contratos de catálogo, autenticação e pedidos

## Objetivo
Implementar e documentar endpoints versionados para autenticação, restaurantes, cardápio, usuários e pedidos.

## Escopo
- Definir schemas de request/response e erros.
- Validar autenticação, autorização e tenant em cada rota.
- Implementar idempotência para criação de pedidos e transições de status.
- Publicar OpenAPI e exemplos atualizados.

## Testes e aceite
Testes unitários, negativos, regressivos e de integração devem cobrir cada rota, payload inválido, usuário não autorizado, tenant inexistente, repetição de request e falhas de persistência. O aceite exige contrato versionado, respostas consistentes e evidências CI.
