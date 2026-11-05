# Changelog

## [0.1.1](https://github.com/brunosrz/Delivery/compare/v0.1.0...v0.1.1) (2026-11-05)

Esta seção reúne as alterações publicadas nesta versão.

### Features

Os recursos incluídos nesta versão são listados abaixo.

- **api:** exportação e anonimização da conta do cliente (LGPD) ([#50](https://github.com/brunosrz/Delivery/issues/50)) ([dcc2fa3](https://github.com/brunosrz/Delivery/commit/dcc2fa362af0b511b87836e851ab5100bd2ccb3a))
- **api:** limite de requisições por janela fixa no D1 ([#48](https://github.com/brunosrz/Delivery/issues/48)) ([c37c3ff](https://github.com/brunosrz/Delivery/commit/c37c3fff807e11a00b9172086fa5da165f4dd143))
- **auth:** autenticação unificada com Better Auth e isolamento por restaurante ([d2ada95](https://github.com/brunosrz/Delivery/commit/d2ada952d25ea91821176606b3c9ee3f4d39f49d))
- caixa de saida (outbox) com cron para eventos de tempo real ([a43cc5a](https://github.com/brunosrz/Delivery/commit/a43cc5a63ed03545a5964639543469917599d314))
- **casa-das-maquinas:** fundação do backend em Cloudflare Workers com D1 ([15fcc8b](https://github.com/brunosrz/Delivery/commit/15fcc8b966b8ca8b0239453318105457f179476c))
- cliente tipado da API e Delivery Express servido pela Casa das Máquinas ([f87a4c9](https://github.com/brunosrz/Delivery/commit/f87a4c9f2ce85f7568a5fb3efd51a9fca49a04b4))
- formulario de contato do site institucional (honeypot, limite por IP, Turnstile opcional) ([1a64d31](https://github.com/brunosrz/Delivery/commit/1a64d31dee6899ec24fc1a25c3da0847252b4280))
- inventário verificável, hub com estado real e smoke tests E2E ([b763189](https://github.com/brunosrz/Delivery/commit/b763189ac4ae3657420498ba27bda61835574272))
- **mkit:** calendario comercial calculado e download em .ics ([961491d](https://github.com/brunosrz/Delivery/commit/961491d544a93dc61f1c4d45256fb8522219c5d0))
- **mkit:** materiais por restaurante com permissao, limpeza de texto, exportacao e metrica de uso ([b8f28cb](https://github.com/brunosrz/Delivery/commit/b8f28cbfa6b45590e5071085c812a59b3e533462))
- pagamento online com Asaas (Pix e cartão) e pendências de contratos e gates ([d357891](https://github.com/brunosrz/Delivery/commit/d357891eb723e4dc4b2215af494019d2a2c21fbc))
- pagamento online com Asaas e endurecimento de contratos, cliente e gates ([e754d45](https://github.com/brunosrz/Delivery/commit/e754d45be92957de54c7a9d219d6c1e3a03c1603))
- **pagamentos:** lease por pedido contra cobranca duplicada, CREDIT_CARD na fatura e Retry-After como data HTTP ([abb7bc9](https://github.com/brunosrz/Delivery/commit/abb7bc9ca630e1bde049426b2eade2cbc1aeae0e))
- **pedidos:** cotação no servidor, pedidos idempotentes e transições de status ([5843396](https://github.com/brunosrz/Delivery/commit/584339667513ebf2dadeef58566da5755b487944))
- plataforma Delivery com base de qualidade e ecossistema renomeado ([bd218f4](https://github.com/brunosrz/Delivery/commit/bd218f4052b4016c8a78704bf2f78bd23a78721b))
- **privacy:** LGPD, GDPR e CCPA completos, com cookies, termos, privacidade e segurança ([#52](https://github.com/brunosrz/Delivery/issues/52)) ([6a45a83](https://github.com/brunosrz/Delivery/commit/6a45a839cd304d324447d6143f31280ef0ebfb09))
- redaction e log de acesso estruturado; corrige tipagem do cliente ([3786fc0](https://github.com/brunosrz/Delivery/commit/3786fc0d10b2c7ae7fac9acbf72c72c82b9b61ca))
- rollback das migracoes D1 (scripts, teste em SQLite real, workflow remoto) e fix do web ([6e2ae6d](https://github.com/brunosrz/Delivery/commit/6e2ae6d3cbe602f6e10671c8f8f678a64496293b))
- script de concorrencia para API real (idempotencia e transicao) com testes ([47d9bf1](https://github.com/brunosrz/Delivery/commit/47d9bf1fa98c14085963726e67399283560ecd9c))
- snapshot do OpenAPI v1 e teste de compatibilidade cliente/OpenAPI ([c5bf232](https://github.com/brunosrz/Delivery/commit/c5bf232a24f710c3d7dde0d2d07dc0940ecdc83f))
- Ta na Entrega com entregas disponiveis e em curso ([4cd8bcb](https://github.com/brunosrz/Delivery/commit/4cd8bcb28bdfba6112e6e20deb6d3a5e43b1ef9a))
- **tempo-real:** Durable Object por restaurante com WebSocket Hibernation ([fc50cb3](https://github.com/brunosrz/Delivery/commit/fc50cb3e4ebcbc13f5fb3b196a83276e64f86fce))
- **tempo-real:** Durable Object por restaurante com WebSocket Hibernation ([cf7b0f2](https://github.com/brunosrz/Delivery/commit/cf7b0f2004886076ee99084fa136092060df43b5))
- **tenant:** exclusão recuperável de restaurante ([#53](https://github.com/brunosrz/Delivery/issues/53)) ([139fd1b](https://github.com/brunosrz/Delivery/commit/139fd1bbc234bd9bdc5f5b97e085eafc21f113a2))
- **web:** painel de materiais do MKit para a equipe do restaurante ([f4ccfb4](https://github.com/brunosrz/Delivery/commit/f4ccfb40b03ed224930d2c1dd46fc379fa338a39))
- **web:** Pedidos na Mao com fila do restaurante e acoes de status ([5a5e48d](https://github.com/brunosrz/Delivery/commit/5a5e48de7c40c45a9819b82e9ca01b15cd67ac62))
- **web:** Pedidos na Mão e Tá na Entrega instaláveis como PWA ([#49](https://github.com/brunosrz/Delivery/issues/49)) ([2e11a8e](https://github.com/brunosrz/Delivery/commit/2e11a8e83c33db66422d41883095e210208a08f2))
- **web:** publica apps/web em Cloudflare Workers com vinext, no SCons e no GitHub Actions ([#61](https://github.com/brunosrz/Delivery/issues/61)) ([1cfc787](https://github.com/brunosrz/Delivery/commit/1cfc787dda9cc2567c95fcf6bb032028aaa54831))
- **web:** sacola, checkout e acompanhamento do pedido (Pix, cartao e na entrega) ([a8ca5aa](https://github.com/brunosrz/Delivery/commit/a8ca5aa1dcc5f19baa5afe3df3106db3baa7adcb))
- workspace pnpm com pacotes de domínio e contratos da API v1 ([614022e](https://github.com/brunosrz/Delivery/commit/614022e3a05d1a41e28d0e287848b596e6318e6d))


### Bug Fixes

As correções incluídas nesta versão são listadas abaixo.

- aplicar review do CodeRabbit no gate de qualidade ([4276562](https://github.com/brunosrz/Delivery/commit/427656242dc968d0cacbec9dfc6cadf1fc2ee116))
- apontar a página de produto para o ProductCard e a action compartilhados ([8ae4378](https://github.com/brunosrz/Delivery/commit/8ae4378f979ac1b72e24132dfc3b950f40ad9d04))
- **ci:** restaurar o gate de qualidade e aplicar achados de review ([83d01b1](https://github.com/brunosrz/Delivery/commit/83d01b1af2490aca6b300df385f74892f72da84b))
- **ci:** restaurar o gate de qualidade e aplicar achados de review ([55852fa](https://github.com/brunosrz/Delivery/commit/55852fa3f9cec57faffede8ea6998ffb2fb114e9))
- **contracts:** remover barras finais sem regex polinomial ([2dae314](https://github.com/brunosrz/Delivery/commit/2dae31480dd3bdf5ff12561d370c9c6379ecd15e))
- data do Pix do Asaas para ISO e ids unicos nos testes de pagamento ([ec9566c](https://github.com/brunosrz/Delivery/commit/ec9566cba97e28c36ef8b8dd69c5eef4ac74d16f))
- **domain:** sanitizeText remove marcacao ate estabilizar e descarta colchetes angulares restantes ([db7101e](https://github.com/brunosrz/Delivery/commit/db7101e2b424a23c06c63d2d86ea35e2b519d7c6))
- escopo do entregador, viabilidade de grupos obrigatórios e guardas da caixa de saída ([#45](https://github.com/brunosrz/Delivery/issues/45)) ([c1b8a23](https://github.com/brunosrz/Delivery/commit/c1b8a23f75fe1909bb7cf3a18a5b77a67f7bb0e3))
- formatacao do teste de fronteiras e checagem exata de host nos testes do Asaas ([1bf0309](https://github.com/brunosrz/Delivery/commit/1bf03094dc241cba42a95b2c6a67d906d5556b1f))
- **release:** corrigir ordem das linhas de release ([00f73c7](https://github.com/brunosrz/Delivery/commit/00f73c72362e0a05268c4fcdedf5f0362bf3f297))
- **release:** map maintenance and development branches correctly ([d8d0db1](https://github.com/brunosrz/Delivery/commit/d8d0db19d713e706c7d4273cee5337d8b2555be2))
- **scons:** --latest sem alvo vale como update --latest ([0037d86](https://github.com/brunosrz/Delivery/commit/0037d86d286e4e1b6e5bde32aac228eb6d196db4))
- **tempo-real:** corrigir os 5 achados do CodeRabbit no PR [#31](https://github.com/brunosrz/Delivery/issues/31) ([6b043e9](https://github.com/brunosrz/Delivery/commit/6b043e99d8a9830f6ddf08bb60501ed1478d7a19))
- **web:** isAllowed fora do route.ts (o Next so aceita exports de rota) ([4c630cd](https://github.com/brunosrz/Delivery/commit/4c630cd9dfd4dc3ec2a8531d52f4303597bc5e84))
