# Planejamento do Monorepo Futuro

> **Documento de proposta.** O que existe hoje é um workspace pnpm com `apps/web`, `apps/casa-das-maquinas`, `packages/domain` e `packages/contracts` (ver [`estrutura-atual.md`](./estrutura-atual.md)). Turborepo, `packages/ui` e `packages/config` **não** estão implementados; ficam adiados até haver dois consumidores e medição de ganho (issue #39). Menções a tRPC, Prisma e NextAuth são históricas: o backend é a Casa das Máquinas (Hono, Drizzle, Better Auth).

Este documento detalha o planejamento e a estrutura do futuro monorepo para o projeto Ecossistema Delivery Express, utilizando Turborepo como ferramenta de gerenciamento.

## Visão Geral

O monorepo será estruturado para permitir o desenvolvimento e deploy independente de cada aplicação, mantendo o compartilhamento de código e componentes entre elas. Utilizaremos Turborepo para gerenciar as dependências, builds e caches, otimizando o processo de desenvolvimento.

## Estrutura de Pastas

```
/
├── apps/ # Aplicações independentes
│ ├── site-institucional/ # Site institucional do ecossistema
│ ├── delivery-express/ # Aplicativo para clientes finais
│ ├── pedidos-na-mao/ # Sistema para restaurantes
│ ├── ta-na-entrega/ # Aplicativo para entregadores
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
```

## Detalhamento dos Componentes

### Apps

#### 1. Site institucional

- **Tecnologias**: Next.js, TailwindCSS
- **Propósito**: Site institucional do ecossistema parceiros
- **Funcionalidades**: Páginas de apresentação, cardápios, calculadora de ROI
- **Estrutura**:
  ```
  /apps/site-institucional/
  ├── app/ # App Router do Next.js
  ├── public/ # Arquivos estáticos
  ├── components/ # Componentes específicos da Site institucional
  ├── lib/ # Utilitários específicos
  ├── next.config.js # Configuração do Next.js
  ├── package.json # Dependências específicas
  └── tsconfig.json # Configuração TypeScript
  ```

#### 2. Delivery Express

- **Tecnologias**: Next.js, TailwindCSS
- **Propósito**: Aplicativo para clientes finais realizarem pedidos
- **Funcionalidades**: Busca de restaurantes, cardápios, carrinho, pagamento
- **Estrutura**: Similar à Site institucional, com componentes específicos para e-commerce

#### 3. Pedidos na Mão

- **Tecnologias**: Next.js, TailwindCSS, React Query
- **Propósito**: Sistema para restaurantes gerenciarem pedidos
- **Funcionalidades**: Painel de controle, gerenciamento de cardápio, relatórios
- **Estrutura**: Similar às anteriores, com foco em dashboards e gerenciamento

#### 4. Tá na Entrega

- **Tecnologias**: Next.js, TailwindCSS, Mapbox/Google Maps
- **Propósito**: Aplicativo para entregadores
- **Funcionalidades**: Visualização de pedidos, navegação, controle de ganhos
- **Estrutura**: Similar às anteriores, com componentes específicos para geolocalização

#### 5. Observabilidade externa

- **Tecnologias**: Next.js, TailwindCSS, TanStack Table
- **Propósito**: Integrações de observabilidade e operação, sem um aplicativo administrativo próprio
- **Funcionalidades**: Gestão de usuários, restaurantes, configurações
- **Estrutura**: Similar às anteriores, com componentes específicos para administração

#### 6. Casa das Máquinas

- **Tecnologias**: Next.js, tRPC, Prisma
- **Propósito**: Backend centralizado com APIs
- **Funcionalidades**: APIs, autenticação, integração com serviços externos
- **Estrutura**:
  ```
  /apps/casa-das-maquinas/
  ├── app/ # App Router do Next.js
  │ └── api/ # Rotas de API
  ├── server/ # Lógica de servidor
  │ ├── auth/ # Autenticação
  │ ├── db/ # Configuração do banco de dados
  │ ├── trpc/ # Configuração do tRPC
  │ └── services/ # Serviços de negócio
  ├── prisma/ # Esquema e migrações do Prisma
  ├── next.config.js # Configuração do Next.js
  ├── package.json # Dependências específicas
  └── tsconfig.json # Configuração TypeScript
  ```

### Packages

#### 1. UI

- **Tecnologias**: React, TailwindCSS, Radix UI
- **Propósito**: Biblioteca de componentes compartilhados
- **Componentes**: Botões, formulários, modais, cards, tabelas, etc.
- **Estrutura**:
  ```
  /packages/ui/
  ├── src/
  │ ├── components/ # Componentes UI
  │ ├── hooks/ # Hooks relacionados a UI
  │ ├── styles/ # Estilos compartilhados
  │ └── index.ts # Exportações
  ├── package.json # Dependências
  └── tsconfig.json # Configuração TypeScript
  ```

#### 2. Config

- **Propósito**: Configurações compartilhadas
- **Conteúdo**: Configurações de build, ambiente, etc.
- **Estrutura**:
  ```
  /packages/config/
  ├── src/
  │ ├── env.ts # Validação de variáveis de ambiente
  │ ├── constants.ts # Constantes compartilhadas
  │ └── index.ts # Exportações
  ├── package.json # Dependências
  └── tsconfig.json # Configuração TypeScript
  ```

#### 3. TSConfig

- **Propósito**: Configurações TypeScript compartilhadas
- **Conteúdo**: Configurações base para diferentes tipos de projetos
- **Estrutura**:
  ```
  /packages/tsconfig/
  ├── base.json # Configuração base
  ├── nextjs.json # Configuração para Next.js
  ├── react-library.json # Configuração para bibliotecas React
  └── package.json # Metadados
  ```

#### 4. ESLint Config

- **Propósito**: Configurações ESLint compartilhadas
- **Conteúdo**: Regras e plugins para diferentes tipos de projetos
- **Estrutura**:
  ```
  /packages/eslint-config/
  ├── base.js # Configuração base
  ├── nextjs.js # Configuração para Next.js
  ├── react.js # Configuração para React
  └── package.json # Dependências e metadados
  ```

#### 5. Utils

- **Propósito**: Utilitários compartilhados
- **Conteúdo**: Funções de formatação, validação, etc.
- **Estrutura**:
  ```
  /packages/utils/
  ├── src/
  │ ├── formatting/ # Funções de formatação
  │ ├── validation/ # Funções de validação
  │ ├── date/ # Utilitários de data
  │ └── index.ts # Exportações
  ├── package.json # Dependências
  └── tsconfig.json # Configuração TypeScript
  ```

#### 6. API Client

- **Tecnologias**: tRPC, React Query
- **Propósito**: Cliente para consumir as APIs da Casa das Máquinas
- **Conteúdo**: Hooks e funções para interagir com as APIs
- **Estrutura**:
  ```
  /packages/api-client/
  ├── src/
  │ ├── client.ts # Configuração do cliente tRPC
  │ ├── hooks/ # Hooks para consumir APIs
  │ └── index.ts # Exportações
  ├── package.json # Dependências
  └── tsconfig.json # Configuração TypeScript
  ```

#### 7. Auth

- **Tecnologias**: NextAuth.js/Auth.js
- **Propósito**: Lógica de autenticação compartilhada
- **Conteúdo**: Configuração de autenticação, hooks, componentes
- **Estrutura**:
  ```
  /packages/auth/
  ├── src/
  │ ├── config.ts # Configuração de autenticação
  │ ├── hooks/ # Hooks de autenticação
  │ ├── components/ # Componentes de autenticação
  │ └── index.ts # Exportações
  ├── package.json # Dependências
  └── tsconfig.json # Configuração TypeScript
  ```

#### 8. Types

- **Propósito**: Tipos TypeScript compartilhados
- **Conteúdo**: Interfaces, tipos, enums
- **Estrutura**:
  ```
  /packages/types/
  ├── src/
  │ ├── models/ # Tipos de modelos de dados
  │ ├── api/ # Tipos de API
  │ ├── enums/ # Enumerações
  │ └── index.ts # Exportações
  ├── package.json # Metadados
  └── tsconfig.json # Configuração TypeScript
  ```

## Configuração do Turborepo

### turbo.json

Exemplo para o Turborepo 2 (a chave é `tasks`, não `pipeline`). Versão de referência: `turbo@^2`.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    },
    "test": {
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.ts", "src/**/*.tsx", "test/**/*.ts", "test/**/*.tsx"]
    }
  }
}
```

`test` não depende de `build`: nem todo pacote tem `build` (os pacotes do workspace são consumidos como TypeScript), e os testes do Vitest compilam o que precisam.

## Estratégia de Migração

A migração do projeto atual (baseado em App Router) para o monorepo será feita gradualmente:

1. **Fase 1: Preparação**
   - Identificar componentes compartilhados
   - Refatorar código para minimizar acoplamento
   - Padronizar interfaces entre projetos

2. **Fase 2: Criação da Estrutura**
   - Configurar Turborepo e PNPM workspaces
   - Criar pacotes compartilhados básicos (ui, utils, config)
   - Configurar CI/CD para o monorepo

3. **Fase 3: Migração dos Projetos**
   - Migrar um projeto por vez, começando pelos mais independentes
   - Adaptar imports para usar os pacotes compartilhados
   - Testar cada projeto após a migração

4. **Fase 4: Refinamento**
   - Otimizar builds e caches
   - Implementar testes automatizados
   - Documentar o processo de desenvolvimento no monorepo

## Benefícios Esperados

1. **Desenvolvimento Independente**: Cada equipe pode trabalhar em seu projeto sem interferir nos demais
2. **Deploys Independentes**: Cada aplicação pode ser deployada separadamente
3. **Compartilhamento de Código**: Evita duplicação e mantém consistência
4. **Builds Otimizados**: Turborepo permite builds incrementais e caching
5. **Versionamento Unificado**: Facilita o gerenciamento de versões e dependências
6. **Testes Integrados**: Possibilidade de testar a integração entre os projetos

## Desafios e Mitigações

1. **Complexidade Inicial**: Documentação clara e onboarding estruturado
2. **Curva de Aprendizado**: Treinamentos e pair programming
3. **Tamanho do Repositório**: Estratégias de git sparse-checkout para clones parciais
4. **CI/CD mais Complexo**: Configuração de builds e deploys condicionais
5. **Gerenciamento de Dependências**: Políticas claras de atualização e versionamento
