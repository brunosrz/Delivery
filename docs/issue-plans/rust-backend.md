# Backend Rust incremental e verificável

## Objetivo
Implementar um serviço Rust para o Delivery como caso real de produção, sem substituir o backend TypeScript antes de provar compatibilidade.

## Escopo

- Escolher um serviço de baixo acoplamento (catálogo ou cálculo de pedido) como primeiro slice.
- Definir contratos HTTP/JSON e eventos antes da implementação Rust.
- Criar workspace Cargo, configuração de lint/format (`cargo fmt`, `clippy`) e matriz de versões suportadas.
- Implementar adapter de persistência e observabilidade sem duplicar regras de negócio.
- Rodar TypeScript e Rust em paralelo atrás de feature flag, comparando respostas e latência.
- Definir migração, rollback, ownership de dados, limites de segurança e critérios para ampliar o escopo.

## Testes e evidências

Testes unitários, negativos e regressivos em Rust; testes de contrato cruzados com o backend TypeScript; integração com banco real; concorrência, timeout, cancelamento, idempotência e falha de dependência. O CI deve executar `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test` e a matriz de contrato. Nenhum tráfego será migrado sem evidência comparável e rollback exercitado.

## Critérios de aceite

O serviço escolhido responde o contrato existente, rejeita entradas inválidas, mantém isolamento de tenant, possui métricas/logs sem segredos, documentação de operação e uma prova de canário. A issue só pode ser encerrada quando a execução Rust estiver demonstrada; estudar a linguagem ou compilar o workspace não conta como migração.
