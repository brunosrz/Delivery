# Lista de Projetos no Monorepo

Este documento lista todos os projetos contidos neste monorepo, suas descrições e responsabilidades.

## Aplicações Frontend

### 1. Site institucional
**Diretório:** `apps/site-institucional`
**Descrição:** Site institucional do ecossistema e dos restaurantes parceiros, com páginas de apresentação, cardápios e calculadora de ROI.
**Tecnologias:** Next.js, TailwindCSS
**URL de Desenvolvimento:** http://localhost:3000

### 2. Delivery Express
**Diretório:** `apps/delivery-express`
**Descrição:** Aplicativo web para clientes finais realizarem pedidos de delivery diretamente dos restaurantes, sem intermediários.
**Tecnologias:** Next.js, TailwindCSS
**URL de Desenvolvimento:** http://delivery.localhost:3000 ou http://localhost:3000/delivery

### 3. Pedidos na Mão
**Diretório:** `apps/pedidos-na-mao`
**Descrição:** Sistema para restaurantes gerenciarem seus pedidos, cardápios e operações diárias.
**Tecnologias:** Next.js, TailwindCSS
**URL de Desenvolvimento:** http://pedidos.localhost:3000 ou http://localhost:3000/pedidos

### 4. Tá na Entrega
**Diretório:** `apps/ta-na-entrega`
**Descrição:** Aplicativo para entregadores parceiros gerenciarem suas entregas e ganhos.
**Tecnologias:** Next.js, TailwindCSS
**URL de Desenvolvimento:** http://entrega.localhost:3000 ou http://localhost:3000/entrega

### 5. Observabilidade externa
**Diretório:** `stack de observabilidade externa`
**Descrição:** Observabilidade e operações ficam fora do produto e devem usar Grafana, métricas e logs.
**Tecnologias:** Next.js, TailwindCSS
**URL de Desenvolvimento:** http://admin.localhost:3000 ou http://localhost:3000/admin

## Backend

### 6. Casa das Máquinas
**Diretório:** `apps/casa-das-maquinas`
**Descrição:** Backend centralizado que fornece APIs para todas as aplicações frontend. Implementa a lógica de negócio, autenticação, autorização e integração com serviços externos.
**Tecnologias:** Next.js API Routes, tRPC
**URL de Desenvolvimento:** http://api.localhost:3000 ou http://localhost:3000/api

## Pacotes Compartilhados

Os pacotes compartilhados estão localizados no diretório `packages/` e são utilizados por múltiplas aplicações:

### UI
**Diretório:** `packages/ui`
**Descrição:** Biblioteca de componentes compartilhados entre as aplicações frontend.

### Config
**Diretório:** `packages/config`
**Descrição:** Configurações compartilhadas para ESLint, TypeScript, Tailwind, etc.

### Utils
**Diretório:** `packages/utils`
**Descrição:** Utilitários e funções auxiliares compartilhadas.

### API
**Diretório:** `packages/api`
**Descrição:** Clientes de API e tipos compartilhados entre frontend e backend.

## Desenvolvimento Multisite

Durante o desenvolvimento, todos os projetos podem ser acessados através de um único servidor gateway, que roteia as requisições para o projeto correto com base no subdomínio ou caminho da URL.

Para iniciar o ambiente de desenvolvimento multisite:

\`\`\`bash
# Instalar dependências
pnpm install

# Iniciar o gateway e todos os projetos
pnpm run dev:multisite
\`\`\`

Após iniciar, os projetos estarão disponíveis nos seguintes endereços:

- **Site institucional:** http://localhost:3000
- **Delivery Express:** http://delivery.localhost:3000 ou http://localhost:3000/delivery
- **Pedidos na Mão:** http://pedidos.localhost:3000 ou http://localhost:3000/pedidos
- **Tá na Entrega:** http://entrega.localhost:3000 ou http://localhost:3000/entrega
- **Observabilidade externa:** http://admin.localhost:3000 ou http://localhost:3000/admin
- **Casa das Máquinas:** http://api.localhost:3000 ou http://localhost:3000/api

## Deploy por ambiente

Hoje o repositório é uma única aplicação Next.js com um único build (`pnpm build`); não existe deploy automatizado. O deploy independente por aplicação é um plano futuro, condicionado à migração para monorepo (issues #11 e #13). Quando existir, a configuração precisa ser versionada no CI e não depender de arquivos gerados por plataforma.
