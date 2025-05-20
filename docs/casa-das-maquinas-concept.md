# Casa das Máquinas - Conceito do Backend Centralizado

## Visão Geral

A "Casa das Máquinas" é o coração tecnológico do ecossistema Delivery by Sorz, funcionando como um backend centralizado que atende todas as aplicações do sistema (Delivery Express, Pedidos na Mão, Vitrine, Administrativo e Tá na Entrega). Construído com Next.js API Routes, este backend implementa uma arquitetura multi-tenant robusta, com foco em segurança, escalabilidade e performance.

## Arquitetura Geral

### Princípios Arquiteturais

1. **API First**: Todas as funcionalidades são expostas através de APIs bem definidas
2. **Multi-tenant por Design**: Isolamento completo de dados entre restaurantes
3. **Tipagem Forte**: Contratos de API totalmente tipados de ponta a ponta
4. **Segurança em Camadas**: Múltiplos níveis de proteção para dados sensíveis
5. **Observabilidade**: Logging, monitoramento e rastreamento abrangentes
6. **Escalabilidade Horizontal**: Capacidade de escalar com o aumento da demanda

### Estrutura de Diretórios

\`\`\`
/casa-das-maquinas
├── app/
│   ├── api/                  # API Routes do Next.js
│   │   ├── auth/             # Rotas de autenticação
│   │   ├── webhooks/         # Webhooks (Stripe, etc.)
│   │   ├── [tenant]/         # Rotas específicas por tenant
│   │   └── trpc/             # Endpoint do tRPC
│   └── route.ts              # Rotas de API REST
├── server/
│   ├── auth/                 # Lógica de autenticação
│   ├── db/                   # Configuração e modelos de banco de dados
│   ├── trpc/                 # Configuração e routers tRPC
│   ├── casl/                 # Configuração de autorização CASL
│   ├── stripe/               # Integrações com Stripe
│   └── utils/                # Utilitários do servidor
└── lib/
    ├── validations/          # Esquemas de validação
    ├── constants/            # Constantes e enums
    └── types/                # Tipos compartilhados
\`\`\`

## Banco de Dados e Multi-tenancy

### Estratégia de Multi-tenancy

Implementamos uma abordagem de multi-tenancy baseada em schemas separados no PostgreSQL:

1. **Schema `public`**: Contém tabelas globais como:
   - `users`: Todos os usuários do sistema
   - `tenants`: Informações dos restaurantes
   - `tenant_users`: Relacionamento entre usuários e tenants

2. **Schema por tenant** (ex: `restaurante1`, `restaurante2`): Contém tabelas específicas como:
   - `products`: Produtos/cardápio do restaurante
   - `orders`: Pedidos feitos neste restaurante
   - `order_items`: Itens dos pedidos

### Middleware de Tenant

Um middleware especializado identifica o tenant atual com base em:
- Domínio personalizado
- Subdomínio
- Parâmetro de URL (slug)

Este middleware configura o contexto de tenant para todas as operações subsequentes, garantindo o isolamento de dados.

### Migrações e Versionamento

- Migrações automáticas para criar novos schemas de tenant
- Versionamento de schema para atualizações sem tempo de inatividade
- Estratégia de rollback seguro para migrações falhas

## Autenticação e Autorização

### Sistema de Autenticação

A autenticação é centralizada e implementada usando:

- **NextAuth.js/Auth.js**: Framework de autenticação para Next.js
- **JWT com rotação**: Tokens de acesso de curta duração com refresh tokens
- **Múltiplos Provedores**:
  - Email/senha com verificação em duas etapas
  - OAuth (Google, Facebook, Apple)
  - Magic links para login sem senha

### Fluxo de Autenticação

1. Usuário faz login através de qualquer aplicação frontend
2. Casa das Máquinas valida credenciais e emite JWT
3. Token contém claims básicas (ID, email) mas não informações de tenant
4. Ao acessar um tenant específico, middleware adiciona contexto de tenant
5. Permissões são verificadas com base no contexto de tenant atual

### RBAC (Role-Based Access Control)

Sistema de papéis em dois níveis:

#### Nível Global
- **SuperAdmin**: Acesso completo a todos os tenants e configurações do sistema
- **Support**: Acesso de suporte a todos os tenants (somente leitura para dados sensíveis)
- **Billing**: Acesso a informações de faturamento e pagamentos

#### Nível de Tenant
- **TenantOwner**: Proprietário do restaurante com acesso completo
- **TenantManager**: Gerente com acesso amplo, exceto configurações financeiras
- **TenantStaff**: Funcionário com acesso limitado a pedidos e produtos
- **TenantDelivery**: Entregador com acesso apenas a entregas atribuídas
- **Customer**: Cliente final com acesso apenas aos seus próprios pedidos

### CASL para Autorização Granular

Utilizamos a biblioteca CASL para implementar autorização baseada em habilidades:

- Definição de permissões por papel e recurso
- Verificações de autorização em cada endpoint
- Filtragem automática de dados baseada em permissões
- Adaptação dinâmica da UI com base nas permissões do usuário

## API e Comunicação

### tRPC para APIs Tipadas

Utilizamos tRPC para criar APIs totalmente tipadas entre backend e frontend:

- Definição de procedimentos fortemente tipados
- Validação automática de entrada com Zod
- Inferência de tipos no cliente
- Middleware para autenticação e autorização
- Tratamento de erros consistente

### Endpoints REST para Integrações

Além do tRPC, mantemos endpoints REST para:
- Webhooks de serviços externos
- Integrações com sistemas de terceiros
- APIs públicas para parceiros

### WebSockets para Comunicação em Tempo Real

Implementamos WebSockets para funcionalidades que exigem atualizações em tempo real:
- Atualizações de status de pedidos
- Localização de entregadores
- Notificações push
- Chat entre cliente, restaurante e entregador

## Processamento de Pagamentos com Stripe

### Integração Stripe Connect

Utilizamos Stripe Connect para gerenciar pagamentos entre múltiplas partes:

1. **Modelo de Plataforma**: A Sorz atua como plataforma intermediando pagamentos
2. **Contas Conectadas**: Cada restaurante e entregador tem sua própria conta Stripe
3. **Distribuição Automática**:
   - Taxa da plataforma (mensalidade + 0,5%)
   - Pagamento ao restaurante (valor principal)
   - Pagamento ao entregador (taxa de entrega)

### Fluxo de Pagamento

1. Cliente faz pedido e paga através do Stripe
2. Valor total é retido temporariamente
3. Quando o pedido é entregue:
   - Entregador recebe a taxa de entrega (em até 1 hora)
   - Restaurante recebe o valor dos produtos (menos taxas)
   - Plataforma recebe sua comissão
4. Em caso de cancelamento ou reembolso, o fluxo de estorno é automatizado

### Webhooks e Reconciliação

- Webhooks do Stripe processam eventos assíncronos
- Sistema de reconciliação verifica discrepâncias
- Relatórios financeiros detalhados para restaurantes e plataforma

## Automações e Processamento Assíncrono

### Filas de Tarefas

Implementamos um sistema de filas para processamento assíncrono:

1. **Notificações**:
   - Emails transacionais (confirmação de pedido, atualizações de status)
   - Notificações push para aplicativos
   - SMS para alertas críticos

2. **Processamento em Lote**:
   - Relatórios diários/semanais
   - Reconciliação financeira
   - Análise de dados e métricas

3. **Tarefas Agendadas**:
   - Lembretes de pedidos pendentes
   - Verificação de pedidos não entregues
   - Atualização de status automática baseada em tempo

### Automação de Marketing

- Envio automático de campanhas baseadas em comportamento
- Segmentação de clientes por padrões de compra
- Cupons personalizados baseados em histórico

## Segurança e Conformidade

### Segurança de Dados

- Criptografia em trânsito (TLS/SSL)
- Criptografia em repouso para dados sensíveis
- Tokenização de informações de pagamento
- Mascaramento de dados sensíveis em logs

### Conformidade

- LGPD (Lei Geral de Proteção de Dados)
- PCI DSS para processamento de pagamentos
- Políticas de retenção e exclusão de dados
- Auditoria de acesso a dados sensíveis

### Proteção contra Ataques

- Rate limiting para prevenir abusos
- Proteção contra CSRF, XSS e injeção SQL
- Validação rigorosa de entrada em todas as APIs
- Monitoramento de padrões suspeitos

## Observabilidade e Monitoramento

### Logging Estruturado

- Logs em formato JSON para facilitar análise
- Níveis de log configuráveis por módulo
- Contexto enriquecido (tenant, usuário, request ID)

### Métricas e Alertas

- Métricas de performance por endpoint e tenant
- Alertas para anomalias e erros críticos
- Dashboards para visualização em tempo real

### Rastreamento Distribuído

- Trace IDs para acompanhar requisições através do sistema
- Análise de performance e gargalos
- Diagnóstico de problemas em produção

## Estratégia de Deploy e Ambientes

### Ambientes Segregados

- **Desenvolvimento**: Para trabalho local e testes iniciais
- **Staging**: Ambiente de pré-produção para testes integrados
- **Produção**: Ambiente de produção com alta disponibilidade

### CI/CD Pipeline

- Testes automatizados em cada PR
- Deploy automático para staging após aprovação
- Deploy para produção com aprovação manual
- Rollback automatizado em caso de falhas

### Feature Flags

- Lançamento gradual de novas funcionalidades
- Testes A/B para otimizações
- Desativação rápida em caso de problemas

## Roadmap Técnico

### Fase 1: Fundação

- Implementação do sistema de autenticação centralizado
- Estrutura multi-tenant básica
- APIs essenciais para operações CRUD
- Integração inicial com Stripe

### Fase 2: Expansão

- Sistema completo de autorização com CASL
- WebSockets para atualizações em tempo real
- Filas de processamento assíncrono
- Relatórios financeiros detalhados

### Fase 3: Otimização

- Análise avançada de dados
- Machine learning para recomendações
- Escalabilidade horizontal completa
- APIs públicas para integrações de parceiros

---

A Casa das Máquinas é projetada para ser o alicerce tecnológico sólido que permite o crescimento sustentável do ecossistema Delivery by Sorz, combinando segurança, performance e flexibilidade para atender às necessidades de restaurantes de todos os portes.
