# Estrutura Atual do Projeto

## Visão Geral

O ecossistema Delivery Express está atualmente estruturado usando o App Router do Next.js, onde cada módulo do sistema é implementado como uma rota dentro da pasta `app/`. Esta abordagem permite um desenvolvimento rápido e integrado, enquanto prepara o terreno para uma futura migração para uma arquitetura de monorepo.

## Estrutura de Diretórios

\`\`\`
/
├── app/ # Diretório principal do App Router
│ ├── page.tsx # Página inicial com navegação para os módulos
│ ├── layout.tsx # Layout compartilhado por todas as páginas
│ ├── globals.css # Estilos globais
│ │
│ ├── site-institucional/ # Site institucional do ecossistema
│ │ ├── page.tsx
│ │ ├── components/
│ │ └── ...
│ │
│ ├── delivery-express/ # Delivery Express - App para clientes
│ │ ├── page.tsx
│ │ ├── components/
│ │ └── ...
│ │
│ ├── pedidos-na-mao/ # Pedidos na Mão - Painel para restaurantes
│ │ ├── page.tsx
│ │ ├── components/
│ │ └── ...
│ │
│ ├── ta-na-entrega/ # Tá na Entrega - App para entregadores
│ │ ├── page.tsx
│ │ ├── components/
│ │ └── ...
│ │
│ ├── observabilidade/ # Integrações com Grafana, métricas e logs
│ │ ├── page.tsx
│ │ ├── components/
│ │ └── ...
│ │
│ └── casa-das-maquinas/ # Backend/API
│ ├── page.tsx
│ ├── api/ # Rotas de API
│ │ ├── auth/
│ │ ├── restaurants/
│ │ ├── orders/
│ │ └── ...
│ └── ...
│
├── components/ # Componentes compartilhados
│ ├── ui/ # Componentes de UI base (shadcn/ui)
│ └── ...
│
├── lib/ # Utilitários e funções compartilhadas
│ ├── utils.ts
│ ├── api-client.ts # Cliente para comunicação com a API
│ └── ...
│
├── public/ # Arquivos estáticos
│
├── docs/ # Documentação do projeto
│
└── ... (outros arquivos de configuração)
\`\`\`

## Módulos do Sistema

### 1. Site institucional (Site institucional)

- **Diretório:** `app/site-institucional/`
- **Descrição:** Site institucional que apresenta o ecossistema Delivery Express para restaurantes interessados.
- **Tema Principal:** Laranja (#FF7A00)

### 2. Delivery Express (Delivery Express)

- **Diretório:** `app/delivery-express/`
- **Descrição:** Aplicativo para clientes finais realizarem pedidos de delivery.
- **Tema Principal:** Vermelho (#E11D48)

### 3. Pedidos na Mão (Pedidos na Mão)

- **Diretório:** `app/pedidos-na-mao/`
- **Descrição:** Sistema para restaurantes gerenciarem seus pedidos e cardápios.
- **Tema Principal:** Azul (#2563EB)

### 4. Tá na Entrega (Tá na Entrega)

- **Diretório:** `app/ta-na-entrega/`
- **Descrição:** Aplicativo para entregadores gerenciarem suas entregas.
- **Tema Principal:** Verde (#10B981)

### 5. Observabilidade externa (Observabilidade externa)

- **Diretório:** `stack de observabilidade externa/`
- **Descrição:** Não há um painel administrativo próprio; operações e observabilidade serão atendidas por Grafana, métricas e logs.
- **Tema Principal:** Roxo (#8B5CF6)

### 6. Casa das Máquinas (Backend)

- **Diretório:** `app/casa-das-maquinas/`
- **Descrição:** Backend centralizado que fornece APIs para todos os módulos.
- **Tema Principal:** Cinza (#64748B)

## Personalização Visual

Cada módulo possui seu próprio tema visual, definido em arquivos de tema específicos:

\`\`\`
app/site-institucional/components/ui/theme.ts
app/delivery-express/components/ui/theme.ts
app/pedidos-na-mao/components/ui/theme.ts
app/ta-na-entrega/components/ui/theme.ts
stack de observabilidade externa/components/ui/theme.ts
\`\`\`

Estes temas são integrados ao Tailwind CSS através do arquivo `tailwind.config.js`, permitindo uma personalização consistente em cada módulo.
\`\`\`
