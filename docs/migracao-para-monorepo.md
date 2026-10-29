# Plano de Migração para Monorepo

## Visão Geral

Este documento descreve o plano para migrar a estrutura atual do projeto (baseada no App Router do Next.js) para uma arquitetura de monorepo usando Turborepo. Esta migração permitirá:

1. Deploys independentes para cada módulo
2. Melhor separação de responsabilidades
3. Escalabilidade da base de código
4. Melhor gerenciamento de dependências

## Estrutura Futura do Monorepo

\`\`\`
/
├── apps/ # Aplicações independentes
│ ├── site-institucional/ # Site institucional do ecossistema
│ ├── delivery-express/ # Delivery Express - App para clientes
│ ├── pedidos-na-mao/ # Pedidos na Mão - Painel para restaurantes
│ ├── ta-na-entrega/ # Tá na Entrega - App para entregadores
│ ├── observabilidade/ # Integrações com Grafana, métricas e logs
│ └── casa-das-maquinas/ # Backend centralizado com APIs
│
├── packages/ # Pacotes compartilhados
│ ├── ui/ # Biblioteca de componentes UI
│ ├── config/ # Configurações compartilhadas
│ ├── tsconfig/ # Configurações TypeScript
│ ├── eslint-config/ # Configurações ESLint
│ ├── utils/ # Utilitários compartilhados
│ ├── api-client/ # Cliente de API para consumir a Casa das Máquinas
│ ├── auth/ # Lógica de autenticação compartilhada
│ └── types/ # Tipos TypeScript compartilhados
│
├── docs/ # Documentação do projeto
├── .github/ # Configurações de CI/CD e GitHub Actions
├── turbo.json # Configuração do Turborepo
├── package.json # Dependências do monorepo
└── pnpm-workspace.yaml # Configuração do workspace PNPM
\`\`\`

## Fases da Migração

### Fase 1: Preparação (Atual)

- ✅ Estruturar o código atual para facilitar a migração
- ✅ Implementar comunicação via API entre os módulos
- ✅ Criar temas visuais específicos para cada módulo
- ✅ Documentar a estrutura atual e o plano de migração

### Fase 2: Configuração do Monorepo

1. **Configuração Inicial**
   - Instalar e configurar Turborepo
   - Configurar PNPM workspaces
   - Criar estrutura básica de diretórios

2. **Extração de Pacotes Compartilhados**
   - Criar pacote `ui` com componentes compartilhados
   - Criar pacote `utils` com utilitários compartilhados
   - Criar pacote `api-client` para comunicação com a API
   - Criar pacotes de configuração (tsconfig, eslint, etc.)

### Fase 3: Migração dos Módulos

1. **Casa das Máquinas (Backend)**
   - Migrar para `apps/casa-das-maquinas`
   - Configurar deploy independente
   - Implementar testes automatizados

2. **Site institucional (Site institucional)**
   - Migrar para `apps/site-institucional`
   - Adaptar imports para usar pacotes compartilhados
   - Configurar deploy independente

3. **Delivery Express (Delivery Express)**
   - Migrar para `apps/delivery-express`
   - Adaptar imports para usar pacotes compartilhados
   - Configurar deploy independente

4. **Pedidos na Mão (Pedidos na Mão)**
   - Migrar para `apps/pedidos-na-mao`
   - Adaptar imports para usar pacotes compartilhados
   - Configurar deploy independente

5. **Tá na Entrega (Tá na Entrega)**
   - Migrar para `apps/ta-na-entrega`
   - Adaptar imports para usar pacotes compartilhados
   - Configurar deploy independente

6. **Observabilidade externa (Observabilidade externa)**
   - Migrar para `stack de observabilidade externa`
   - Adaptar imports para usar pacotes compartilhados
   - Configurar deploy independente

### Fase 4: Refinamento e Otimização

1. **Otimização de Builds**
   - Configurar cache do Turborepo
   - Otimizar dependências
   - Implementar builds incrementais

2. **CI/CD**
   - Configurar GitHub Actions para o monorepo
   - Implementar deploys automáticos
   - Configurar testes automatizados

3. **Documentação**
   - Atualizar documentação para refletir a nova estrutura
   - Criar guias de desenvolvimento para o monorepo
   - Documentar processos de deploy

## Benefícios da Migração

### Para Desenvolvedores

- **Desenvolvimento Isolado**: Trabalhar em um módulo sem afetar os outros
- **Builds Mais Rápidos**: Apenas reconstruir o que mudou
- **Melhor Organização**: Código mais modular e bem estruturado
- **Reutilização de Código**: Pacotes compartilhados entre aplicações

### Para o Negócio

- **Deploys Independentes**: Lançar novas funcionalidades por módulo
- **Melhor Escalabilidade**: Equipes podem trabalhar em paralelo
- **Maior Resiliência**: Problemas em um módulo não afetam os outros
- **Time-to-Market Reduzido**: Ciclos de desenvolvimento mais rápidos

## Desafios e Mitigações

### Desafios

1. **Complexidade Inicial**: A configuração do monorepo pode ser complexa
2. **Curva de Aprendizado**: Desenvolvedores precisam se adaptar à nova estrutura
3. **CI/CD Mais Complexo**: Configuração de pipelines para múltiplas aplicações
4. **Gerenciamento de Dependências**: Evitar conflitos e versões incompatíveis

### Mitigações

1. **Documentação Detalhada**: Criar guias e tutoriais para a equipe
2. **Migração Gradual**: Migrar um módulo por vez, validando cada etapa
3. **Templates e Exemplos**: Fornecer exemplos de código para referência
4. **Automação**: Automatizar tarefas repetitivas com scripts e ferramentas

## Cronograma Estimado

- **Fase 1 (Preparação)**: 2-4 semanas
- **Fase 2 (Configuração)**: 1-2 semanas
- **Fase 3 (Migração)**: 4-8 semanas (dependendo da complexidade)
- **Fase 4 (Refinamento)**: 2-4 semanas

Total: 9-18 semanas para migração completa
\`\`\`
