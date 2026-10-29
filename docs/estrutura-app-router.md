# Estrutura do Projeto com App Router

Este documento descreve a nova estrutura do projeto utilizando o App Router do Next.js, onde cada subprojeto é um diretório dentro de `app/`.

## Visão Geral

Em vez de usar uma estrutura de monorepo com múltiplos apps separados, estamos usando uma abordagem mais simples com o App Router do Next.js. Cada "projeto" é um diretório dentro de `app/`, seguindo a estrutura de roteamento baseada em arquivos do Next.js.

## Estrutura de Diretórios

\`\`\`
/app
/page.tsx # Página principal com lista de projetos
/layout.tsx # Layout compartilhado por todos os projetos
/site-institucional # Site institucional do ecossistema
/page.tsx
/[...outras páginas]
/delivery-express # Aplicativo para clientes finais
/page.tsx
/[...outras páginas]
/pedidos-na-mao # Sistema para restaurantes
/page.tsx
/[...outras páginas]
/ta-na-entrega # Aplicativo para entregadores
/page.tsx
/[...outras páginas]
/page.tsx
/[...outras páginas]
/casa-das-maquinas # Backend/API
/page.tsx
/api # Rotas de API
/[...rotas de API]
/components # Componentes compartilhados
/lib # Utilitários e funções compartilhadas
/public # Arquivos estáticos
\`\`\`

## Vantagens desta Abordagem

1. **Simplicidade**: Estrutura mais simples e fácil de entender
2. **Compartilhamento de Código**: Facilita o compartilhamento de componentes e lógica entre projetos
3. **Navegação Fluida**: Navegação entre projetos sem recarregar a página
4. **Desenvolvimento Unificado**: Um único servidor de desenvolvimento para todos os projetos
5. **Compatibilidade com o produto**: mantém as rotas e módulos independentes sem dependência de um gerador externo

## Plano para o Futuro

No futuro, cada projeto será movido para um app separado dentro de um turborepo para permitir deploys individuais:

\`\`\`
/apps
/site-institucional
/delivery-express
/pedidos-na-mao
/ta-na-entrega
/casa-das-maquinas
/packages
/ui # Componentes compartilhados
/utils # Utilitários compartilhados
/api-client # Cliente de API compartilhado
\`\`\`

Esta migração será feita gradualmente, mantendo a compatibilidade entre as abordagens durante a transição.

## Como Usar

Para iniciar o desenvolvimento:

\`\`\`bash
pnpm dev
\`\`\`

Todos os projetos estarão disponíveis através do mesmo servidor Next.js:

- **Página Principal**: http://localhost:3000
- **Site institucional**: http://localhost:3000/site-institucional
- **Delivery Express**: http://localhost:3000/delivery-express
- **Pedidos na Mão**: http://localhost:3000/pedidos-na-mao
- **Tá na Entrega**: http://localhost:3000/ta-na-entrega
- **Observabilidade**: Grafana, métricas e logs são serviços externos ao App Router.
- **Casa das Máquinas**: http://localhost:3000/casa-das-maquinas
