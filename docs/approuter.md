# Abordagem Atual com App Router e Plano de Migração para Monorepo

Este documento explica por que estamos utilizando a abordagem do App Router do Next.js em vez de um monorepo no cenário atual, e como estamos estruturando o projeto para facilitar a migração futura.

## Por que não estamos usando monorepo no cenário atual

### 1. Desenvolvimento centrado no produto

O desenvolvimento inicial priorizou velocidade e uma aplicação única, o que cria limitações para um monorepo:

- **Suporte Limitado a Estruturas Complexas**: a aplicação inicial funciona melhor com estruturas simples e convencionais.
- **Dificuldade em Navegar entre Múltiplos Projetos**: múltiplos projetos independentes exigem contratos explícitos.
- **Foco no App Router**: o projeto foi iniciado com App Router e precisa manter limites claros.
- **Limitações com Ferramentas Específicas**: ferramentas de monorepo precisam ser adotadas e validadas pelo CI.

### 2. Velocidade de Desenvolvimento Inicial

- **Setup Mais Simples**: A abordagem com App Router permite um setup mais rápido e direto.
- **Menos Configuração**: Não é necessário configurar Turborepo, workspaces, etc.
- **Prototipagem Rápida**: Facilita a criação rápida de protótipos e MVPs.
- **Compartilhamento Implícito**: Componentes e código podem ser compartilhados naturalmente dentro da mesma aplicação.

### 3. Foco na Experiência do Usuário

- **Navegação Fluida**: A navegação entre diferentes partes do sistema é mais fluida sem recarregamentos.
- **Estado Compartilhado**: Facilita o compartilhamento de estado entre diferentes partes da aplicação.
- **Consistência Visual**: Garante maior consistência visual e de experiência.

### 4. Simplicidade Operacional

- **Um Único Deploy**: Apenas um deploy para toda a aplicação.
- **Gerenciamento de Dependências Simplificado**: Um único `package.json` para gerenciar.
- **Debugging Mais Simples**: Facilita o processo de debugging por ter tudo em um único projeto.

## Como estamos estruturando o projeto para facilitar a migração futura

### 1. Organização de Diretórios

Estamos organizando o código de forma que a migração para um monorepo seja o mais suave possível:

\`\`\`
/app
/site-institucional/ # Será migrado para /apps/site-institucional
/delivery-express/ # Será migrado para /apps/delivery-express
/pedidos-na-mao/ # Será migrado para /apps/pedidos-na-mao
/ta-na-entrega/ # Será migrado para /apps/ta-na-entrega

# Observabilidade: Grafana, métricas e logs ficam fora do App Router

/casa-das-maquinas/ # Será migrado para /apps/casa-das-maquinas
/components
/ui/ # Será migrado para /packages/ui
/[projeto]/ # Componentes específicos de cada projeto
/lib
/utils/ # Será migrado para /packages/utils
/api-client/ # Será migrado para /packages/api-client
/auth/ # Será migrado para /packages/auth
\`\`\`

### 2. Práticas de Código

- **Isolamento de Componentes**: Componentes específicos de cada projeto são mantidos em diretórios separados.
- **Minimização de Acoplamento**: Reduzimos o acoplamento entre diferentes partes do sistema.
- **Interfaces Bem Definidas**: Definimos interfaces claras para comunicação entre diferentes partes.
- **Tipagem Forte**: Utilizamos TypeScript com tipagem rigorosa para facilitar refatorações futuras.

### 3. Importações e Dependências

- **Imports Absolutos**: Utilizamos imports absolutos com aliases para facilitar a migração.
  \`\`\`tsx
  // Em vez de
  import Button from '../../components/ui/button';

  // Usamos
  import { Button } from '@/components/ui';
  \`\`\`

- **Agrupamento Lógico**: Agrupamos componentes e utilitários de forma lógica que reflete a futura estrutura de pacotes.
  \`\`\`tsx
  // Facilita a migração para
  import { Button } from '@delivery/ui';
  \`\`\`

- **Minimização de Dependências Cruzadas**: Evitamos que código de um projeto dependa diretamente de outro.

### 4. Estratégia de Migração Gradual

Planejamos uma migração gradual para o monorepo:

1. **Extração de Pacotes Compartilhados**:
   - Primeiro, extrairemos componentes UI, utilitários e configurações compartilhadas para pacotes.
   - Isso pode ser feito sem alterar a estrutura principal do projeto.

2. **Migração Projeto por Projeto**:
   - Começaremos com o projeto mais independente (provavelmente "Casa das Máquinas").
   - Cada projeto será migrado para sua própria aplicação no monorepo.
   - Atualizaremos as importações para usar os pacotes compartilhados.

3. **Testes e Validação**:
   - Após cada migração, realizaremos testes completos para garantir que tudo funcione como esperado.
   - Validaremos a experiência do usuário e a performance.

4. **Ajustes Finais**:
   - Configuração de CI/CD para o monorepo.
   - Otimização de builds e caches.
   - Documentação do novo processo de desenvolvimento.

## Benefícios da Abordagem Atual

1. **Desenvolvimento Rápido**: Facilita ciclos curtos com validação automatizada.
2. **Simplicidade**: Estrutura mais simples e fácil de entender.
3. **Experiência Unificada**: Navegação fluida entre diferentes partes do sistema.
4. **Compartilhamento Implícito**: Facilita o compartilhamento de código e componentes.

## Benefícios da Migração Futura para Monorepo

1. **Escalabilidade**: Melhor suporte para equipes maiores trabalhando em paralelo.
2. **Deploys Independentes**: Cada aplicação pode ser deployada separadamente.
3. **Isolamento**: Melhor isolamento entre diferentes partes do sistema.
4. **Builds Otimizados**: Turborepo permite builds incrementais e caching.
5. **Gerenciamento de Dependências**: Melhor controle sobre dependências compartilhadas.

## Conclusão

A abordagem atual com App Router é adequada para o produto, permitindo ciclos rápidos e previsíveis. A estrutura também facilita uma migração futura para um monorepo quando os limites de domínio estiverem comprovados.

Esta estratégia nos permite aproveitar o melhor dos dois mundos: a simplicidade e rapidez do App Router agora, e a escalabilidade e flexibilidade do monorepo no futuro.
