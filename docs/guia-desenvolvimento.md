# Guia de Desenvolvimento

## Visão Geral

Este guia fornece instruções para desenvolvedores que trabalham no ecossistema Delivery Express, abordando a configuração do ambiente, convenções de código, e fluxos de trabalho recomendados.

## Configuração do Ambiente

### Requisitos

- Node.js 18.x ou superior
- PNPM 8.x ou superior
- Git

### Instalação

1. Clone o repositório:
   \`\`\`bash
   git clone https://github.com/brunosrz/Delivery.git
   cd delivery-system
   \`\`\`

2. Instale as dependências:
   \`\`\`bash
   pnpm install
   \`\`\`

3. Configure as variáveis de ambiente:
   \`\`\`bash
   cp .env.example .env.local

   # Edite .env.local com suas configurações

   \`\`\`

4. Inicie o servidor de desenvolvimento:
   \`\`\`bash
   pnpm dev
   \`\`\`

5. Acesse o projeto em [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

Consulte o documento [Estrutura Atual](./estrutura-atual.md) para uma visão detalhada da organização do projeto.

## Convenções de Código

### Nomenclatura

- **Arquivos e Diretórios**: Use kebab-case para arquivos e diretórios
  - Exemplo: `order-details.tsx`, `payment-methods/`

- **Componentes React**: Use PascalCase para componentes
  - Exemplo: `OrderDetails.tsx`, `PaymentForm.tsx`

- **Hooks**: Prefixe com `use` e use camelCase
  - Exemplo: `useOrderStatus.ts`, `useRestaurantMenu.ts`

- **Utilitários**: Use camelCase para funções e constantes
  - Exemplo: `formatCurrency.ts`, `validateAddress.ts`

### Estilização

- Use Tailwind CSS para estilização
- Siga o tema de cores específico de cada módulo
- Use variáveis CSS para valores reutilizáveis
- Mantenha a responsividade em mente (mobile-first)

### Importações

Organize as importações na seguinte ordem:

1. Pacotes externos (React, Next.js, etc.)
2. Componentes e hooks internos
3. Utilitários e tipos
4. Estilos

Exemplo:
\`\`\`typescript
// 1. Pacotes externos
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// 2. Componentes e hooks internos
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

// 3. Utilitários e tipos
import { formatCurrency } from '@/lib/utils';
import type { Order } from '@/types';

// 4. Estilos
import './styles.css';
\`\`\`

## Fluxo de Trabalho

### Desenvolvimento de Funcionalidades

1. **Crie uma branch**: Para cada funcionalidade ou correção, crie uma branch a partir de `main`
   \`\`\`bash
   git checkout -b feature/nome-da-funcionalidade
   \`\`\`

2. **Desenvolva a funcionalidade**: Implemente a funcionalidade seguindo as convenções de código

3. **Teste localmente**: Certifique-se de que tudo funciona como esperado
   \`\`\`bash
   pnpm dev
   pnpm test
   pnpm lint
   \`\`\`

4. **Commit das alterações**: Use mensagens de commit descritivas
   \`\`\`bash
   git add .
   git commit -m "feat: adiciona funcionalidade X"
   \`\`\`

5. **Push para o repositório**: Envie suas alterações para o repositório remoto
   \`\`\`bash
   git push origin feature/nome-da-funcionalidade
   \`\`\`

6. **Crie um Pull Request**: Solicite a revisão do seu código

### Convenções de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Alterações na documentação
- `style`: Alterações que não afetam o código (formatação, etc.)
- `refactor`: Refatoração de código
- `test`: Adição ou correção de testes
- `chore`: Alterações no processo de build, ferramentas, etc.

Exemplo:
\`\`\`
feat(pedidos): adiciona filtro por status
\`\`\`

## Trabalhando com Módulos

### Site institucional (Site institucional)

- Foco em apresentação e marketing
- Páginas estáticas e otimizadas para SEO
- Formulários de contato e demonstração

### Delivery Express (Delivery Express)

- Experiência do usuário final (cliente)
- Fluxo de pedido e checkout
- Acompanhamento de pedidos

### Pedidos na Mão (Pedidos na Mão)

- Interface para restaurantes
- Gerenciamento de cardápio e pedidos
- Relatórios e estatísticas

### Tá na Entrega (Tá na Entrega)

- Interface para entregadores
- Gerenciamento de entregas
- Mapas e rotas

### Observabilidade externa (Observabilidade externa)

- Observabilidade e operação por Grafana, métricas e logs
- Gerenciamento de usuários e restaurantes
- Configurações do sistema

### Casa das Máquinas (Backend)

- APIs e serviços
- Autenticação e autorização
- Integração com serviços externos

## Comunicação entre Módulos

Consulte o documento [Comunicação Entre Módulos](./comunicacao-entre-modulos.md) para entender como os diferentes módulos se comunicam.

## Testes

### Tipos de Testes

- **Testes Unitários**: Testar componentes e funções isoladamente
- **Testes de Integração**: Testar a interação entre componentes
- **Testes E2E**: Testar fluxos completos de usuário

### Executando Testes

\`\`\`bash

# Executar todos os testes

pnpm test

# Executar testes de um módulo específico

pnpm test:site-institucional
pnpm test:delivery

# etc.

# Executar testes em modo watch

pnpm test:watch
\`\`\`

## Deploy

### Ambientes

- **Desenvolvimento**: Ambiente para testes durante o desenvolvimento
- **Staging**: Ambiente de pré-produção para testes finais
- **Produção**: Ambiente de produção

### Processo de Deploy

1. Merge do PR para a branch `main`
2. CI/CD executa testes automatizados
3. Deploy automático para ambiente de desenvolvimento
4. Após aprovação, deploy para staging
5. Após aprovação final, deploy para produção

## Releases

O workflow `Release` usa o Release Please para abrir o PR de versão a cada push na `main`. Esse PR é criado com o `GITHUB_TOKEN`, e o GitHub não dispara workflows automaticamente para PRs abertos por esse token. Antes de mergear o PR de release, aprove manualmente a execução do gate `Quality` na aba Actions (ou feche e reabra o PR). A alternativa definitiva é usar um token de GitHub App, registrada como melhoria futura.

## Recursos Adicionais

- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Tailwind CSS](https://tailwindcss.com/docs)
- [Documentação do shadcn/ui](https://ui.shadcn.com)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Turborepo](https://turbo.build/repo) (para referência futura)
  \`\`\`
