# Guia de Desenvolvimento

## Visão Geral

Este guia fornece instruções para desenvolvedores que trabalham no ecossistema Delivery Express, abordando a configuração do ambiente, convenções de código, e fluxos de trabalho recomendados.

## Configuração do Ambiente

### Requisitos

- Node.js `>=22 <25` (o Node 26 quebra o build do webpack) e pnpm 11
- Python 3.9+ e SCons (opcional, para `scons`)
- Git

### Instalação

1. Clone o repositório:
   \`\`\`bash
   git clone https://github.com/brunosrz/Delivery.git
   cd Delivery
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

Scripts reais da raiz (`package.json`):

| Script                 | O que faz                                                          |
| ---------------------- | ------------------------------------------------------------------ |
| `pnpm dev` / `build` / `start` | Next.js (`apps/web`)                                       |
| `pnpm lint`            | ESLint em todos os pacotes                                         |
| `pnpm format:check`    | Prettier                                                           |
| `pnpm typecheck`       | `tsc --noEmit` em todos os pacotes                                 |
| `pnpm test`            | Vitest em todos os pacotes (o backend roda no `workerd`)           |
| `pnpm test:coverage`   | Testes com cobertura                                               |
| `pnpm check:boundaries`| Falha se um pacote importa o que não pode (matriz em `scripts/check-import-boundaries.mjs`) |
| `pnpm e2e`             | Playwright (`apps/web`)                                            |

O mesmo fluxo existe via SCons: `scons check`, `scons tests`, `scons lint`. Os testes da automação Python: `python -m unittest discover -s tests -t . -p 'test_scons*.py'`.

### Subindo a API localmente

```bash
cd apps/casa-das-maquinas
cp .dev.vars.example .dev.vars        # preencha BETTER_AUTH_SECRET
pnpm db:migrate:local                 # migrações no D1 local
pnpm dev                              # wrangler dev
```

Em `apps/web/.env.local`, aponte `CASA_DAS_MAQUINAS_URL` para a API. O pagamento online (Asaas) é opcional em desenvolvimento: veja `docs/pagamentos-asaas.md`.

## Deploy

### Ambientes

- **Desenvolvimento**: local (`wrangler dev` + `next dev`)
- **Staging**: planejado (ainda não existe)
- **Produção**: deploy por `.github/workflows/deploy.yml`

### Processo de Deploy

1. Merge do PR para a branch `main`
2. CI/CD executa testes automatizados
3. Deploy automático para ambiente de desenvolvimento
4. Após aprovação, deploy para staging
5. Após aprovação final, deploy para produção

## Releases

As linhas de release ficam em `.github/release-lines.json`: `main` é a série estável (patches, ex.: `0.1.x`) e `release/X.Y` é a próxima minor em desenvolvimento. Cada PR recebe automaticamente a milestone da linha da sua base (`pr-release-milestone.yml`) e o CI bloqueia combinações incompatíveis. O título do PR precisa seguir Conventional Commits, pois alimenta o versionamento e o changelog do Release Please. Ao publicar uma minor, `rotate-release-lines.yml` abre a próxima `release/X.Y`, e `forward-port-release.yml` mantém a minor em desenvolvimento atualizada com `main`. O detalhe dos workflows e dos secrets está em `.github/DEPLOYMENT.md`.

**Critério de merge:** o PR de release só pode ser mergeado quando o gate `Quality` tiver concluído com sucesso no commit atual do PR. PRs abertos com o `GITHUB_TOKEN` não disparam workflows; aprovar a execução na aba Actions (ou configurar o secret `RELEASE_PLEASE_TOKEN`) apenas inicia o gate, não substitui o resultado verde.

## Recursos Adicionais

- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Tailwind CSS](https://tailwindcss.com/docs)
- [Documentação do shadcn/ui](https://ui.shadcn.com)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Turborepo](https://turbo.build/repo) (para referência futura)
  \`\`\`
