import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, GitFork, Lock, Server, Settings, Zap } from "lucide-react"

export default function CasaDasMaquinasPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
          <Database className="h-8 w-8" />
          Casa das Máquinas
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl">
          Backend centralizado que fornece APIs para todas as aplicações frontend. Implementa a lógica de negócio,
          autenticação, autorização e integração com serviços externos.
        </p>
      </div>

      <Tabs defaultValue="architecture" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="architecture">Arquitetura</TabsTrigger>
          <TabsTrigger value="features">Funcionalidades</TabsTrigger>
          <TabsTrigger value="improvements">Melhorias Futuras</TabsTrigger>
        </TabsList>

        <TabsContent value="architecture">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Princípios Arquiteturais
                </CardTitle>
                <CardDescription>Fundamentos que guiam o design do backend centralizado</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {architecturalPrinciples.map((principle) => (
                    <li
                      key={principle.name}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <div className="mt-0.5">{principle.icon}</div>
                      <div>
                        <div className="font-medium">{principle.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{principle.description}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitFork className="h-5 w-5" />
                  Estrutura de Diretórios
                </CardTitle>
                <CardDescription>Organização do código no backend centralizado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto">
                  <pre className="text-sm">
                    {`/casa-das-maquinas
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
    └── types/                # Tipos compartilhados`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Multi-tenancy e Banco de Dados
                </CardTitle>
                <CardDescription>Estratégia de isolamento de dados entre restaurantes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Estratégia de Multi-tenancy</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Implementamos uma abordagem de multi-tenancy baseada em schemas separados no PostgreSQL:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">
                          Schema <code>public</code>
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Contém tabelas globais como:</p>
                        <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                          <li>
                            <code>users</code>: Todos os usuários do sistema
                          </li>
                          <li>
                            <code>tenants</code>: Informações dos restaurantes
                          </li>
                          <li>
                            <code>tenant_users</code>: Relacionamento entre usuários e tenants
                          </li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Schema por tenant</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Cada tenant tem seu próprio schema (ex: <code>restaurante1</code>) contendo:
                        </p>
                        <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                          <li>
                            <code>products</code>: Produtos/cardápio do restaurante
                          </li>
                          <li>
                            <code>orders</code>: Pedidos feitos neste restaurante
                          </li>
                          <li>
                            <code>order_items</code>: Itens dos pedidos
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Middleware de Tenant</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Um middleware especializado identifica o tenant atual com base em:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Domínio personalizado</li>
                      <li>Subdomínio</li>
                      <li>Parâmetro de URL (slug)</li>
                    </ul>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Este middleware configura o contexto de tenant para todas as operações subsequentes, garantindo o
                      isolamento de dados.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Migrações e Versionamento</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Migrações automáticas para criar novos schemas de tenant</li>
                      <li>Versionamento de schema para atualizações sem tempo de inatividade</li>
                      <li>Estratégia de rollback seguro para migrações falhas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Autenticação e Autorização
                </CardTitle>
                <CardDescription>Sistema de controle de acesso em múltiplos níveis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Sistema de Autenticação</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      A autenticação é centralizada e implementada usando:
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>
                        <strong>NextAuth.js/Auth.js</strong>: Framework de autenticação para Next.js
                      </li>
                      <li>
                        <strong>JWT com rotação</strong>: Tokens de acesso de curta duração com refresh tokens
                      </li>
                      <li>
                        <strong>Múltiplos Provedores</strong>: Email/senha, OAuth, Magic links
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">RBAC (Role-Based Access Control)</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Sistema de papéis em dois níveis:</p>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="border rounded-lg p-3">
                        <h4 className="text-sm font-medium mb-1">Nível Global</h4>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline">SuperAdmin</Badge>
                          <Badge variant="outline">Support</Badge>
                          <Badge variant="outline">Billing</Badge>
                        </div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="text-sm font-medium mb-1">Nível de Tenant</h4>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline">TenantOwner</Badge>
                          <Badge variant="outline">TenantManager</Badge>
                          <Badge variant="outline">TenantStaff</Badge>
                          <Badge variant="outline">TenantDelivery</Badge>
                          <Badge variant="outline">Customer</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">CASL para Autorização Granular</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Utilizamos a biblioteca CASL para implementar autorização baseada em habilidades:
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Definição de permissões por papel e recurso</li>
                      <li>Verificações de autorização em cada endpoint</li>
                      <li>Filtragem automática de dados baseada em permissões</li>
                      <li>Adaptação dinâmica da UI com base nas permissões do usuário</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  API e Comunicação
                </CardTitle>
                <CardDescription>Interfaces de comunicação entre frontend e backend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">tRPC para APIs Tipadas</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Utilizamos tRPC para criar APIs totalmente tipadas entre backend e frontend:
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Definição de procedimentos fortemente tipados</li>
                      <li>Validação automática de entrada com Zod</li>
                      <li>Inferência de tipos no cliente</li>
                      <li>Middleware para autenticação e autorização</li>
                      <li>Tratamento de erros consistente</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Endpoints REST para Integrações</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Além do tRPC, mantemos endpoints REST para:
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Webhooks de serviços externos</li>
                      <li>Integrações com sistemas de terceiros</li>
                      <li>APIs públicas para parceiros</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">WebSockets para Comunicação em Tempo Real</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Implementamos WebSockets para funcionalidades que exigem atualizações em tempo real:
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Atualizações de status de pedidos</li>
                      <li>Localização de entregadores</li>
                      <li>Notificações push</li>
                      <li>Chat entre cliente, restaurante e entregador</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Processamento de Pagamentos
                </CardTitle>
                <CardDescription>Integração com Stripe para processamento de pagamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Integração Stripe Connect</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Utilizamos Stripe Connect para gerenciar pagamentos entre múltiplas partes:
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>
                        <strong>Modelo de Plataforma</strong>: O ecossistema Delivery Express atua como plataforma intermediando pagamentos
                      </li>
                      <li>
                        <strong>Contas Conectadas</strong>: Cada restaurante e entregador tem sua própria conta Stripe
                      </li>
                      <li>
                        <strong>Distribuição Automática</strong>: Taxa da plataforma, pagamento ao restaurante e ao
                        entregador
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Fluxo de Pagamento</h3>
                    <ol className="text-sm list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Cliente faz pedido e paga através do Stripe</li>
                      <li>Valor total é retido temporariamente</li>
                      <li>Quando o pedido é entregue, o valor é distribuído entre as partes</li>
                      <li>Em caso de cancelamento, o fluxo de estorno é automatizado</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Webhooks e Reconciliação</h3>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Webhooks do Stripe processam eventos assíncronos</li>
                      <li>Sistema de reconciliação verifica discrepâncias</li>
                      <li>Relatórios financeiros detalhados para restaurantes e plataforma</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Automações e Processamento Assíncrono
                </CardTitle>
                <CardDescription>Processamento de tarefas em background e automações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Filas de Tarefas</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Implementamos um sistema de filas para processamento assíncrono:
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="border rounded-lg p-3">
                        <h4 className="text-sm font-medium mb-1">Notificações</h4>
                        <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                          <li>Emails transacionais</li>
                          <li>Notificações push para aplicativos</li>
                          <li>SMS para alertas críticos</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="text-sm font-medium mb-1">Processamento em Lote</h4>
                        <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                          <li>Relatórios diários/semanais</li>
                          <li>Reconciliação financeira</li>
                          <li>Análise de dados e métricas</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="text-sm font-medium mb-1">Tarefas Agendadas</h4>
                        <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                          <li>Lembretes de pedidos pendentes</li>
                          <li>Verificação de pedidos não entregues</li>
                          <li>Atualização de status automática baseada em tempo</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Automação de Marketing</h3>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Envio automático de campanhas baseadas em comportamento</li>
                      <li>Segmentação de clientes por padrões de compra</li>
                      <li>Cupons personalizados baseados em histórico</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="improvements">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sugestões para Aprimoramento</CardTitle>
                <CardDescription>
                  Recomendações técnicas e estratégicas para melhorar performance, segurança e escalabilidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {improvementCategories.map((category) => (
                    <div key={category.name} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        {category.icon}
                        {category.name}
                      </h3>
                      <ul className="space-y-2">
                        {category.items.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="min-w-4 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                            <span className="text-gray-600 dark:text-gray-400">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priorização de Implementação</CardTitle>
                <CardDescription>Abordagem gradual para implementar as melhorias sugeridas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {implementationPhases.map((phase, index) => (
                    <div key={phase.name} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        {phase.name}
                        <Badge variant="outline" className="ml-2">
                          {phase.timeline}
                        </Badge>
                      </h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {phase.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="min-w-4 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                            <span className="text-gray-600 dark:text-gray-400">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const architecturalPrinciples = [
  {
    name: "API First",
    description: "Todas as funcionalidades são expostas através de APIs bem definidas",
    icon: <Zap className="h-5 w-5 text-blue-500" />,
  },
  {
    name: "Multi-tenant por Design",
    description: "Isolamento completo de dados entre restaurantes",
    icon: <GitFork className="h-5 w-5 text-blue-500" />,
  },
  {
    name: "Tipagem Forte",
    description: "Contratos de API totalmente tipados de ponta a ponta",
    icon: <Code2 className="h-5 w-5 text-blue-500" />,
  },
  {
    name: "Segurança em Camadas",
    description: "Múltiplos níveis de proteção para dados sensíveis",
    icon: <Lock className="h-5 w-5 text-blue-500" />,
  },
  {
    name: "Observabilidade",
    description: "Logging, monitoramento e rastreamento abrangentes",
    icon: <Eye className="h-5 w-5 text-blue-500" />,
  },
  {
    name: "Escalabilidade Horizontal",
    description: "Capacidade de escalar com o aumento da demanda",
    icon: <ArrowsOutCardinal className="h-5 w-5 text-blue-500" />,
  },
]

const improvementCategories = [
  {
    name: "Arquitetura e Organização",
    icon: <GitFork className="h-5 w-5 text-blue-500" />,
    items: [
      "Adoção de Domain-Driven Design (DDD)",
      "Microsserviços Graduais para áreas críticas",
      "API Gateway Dedicado para gerenciamento centralizado",
    ],
  },
  {
    name: "Performance e Escalabilidade",
    icon: <Zap className="h-5 w-5 text-green-500" />,
    items: [
      "Implementação de Cache Distribuído com Redis",
      "Edge Functions para Geolocalização",
      "Banco de Dados Híbrido (PostgreSQL + MongoDB)",
      "Sharding Geográfico para melhorar performance regional",
    ],
  },
  {
    name: "Segurança Avançada",
    icon: <Lock className="h-5 w-5 text-red-500" />,
    items: [
      "Análise de Segurança Contínua no pipeline CI/CD",
      "Proteção contra Fraudes baseada em machine learning",
      "Autenticação Passwordless para melhor experiência",
      "Auditoria Avançada com capacidade de rollback",
    ],
  },
  {
    name: "Integrações e Extensibilidade",
    icon: <Settings className="h-5 w-5 text-purple-500" />,
    items: [
      "Sistema de Plugins para extensões de terceiros",
      "Webhooks Bidirecionais para integrações",
      "Integração com Marketplaces (iFood, Uber Eats)",
      "API GraphQL Complementar para consultas flexíveis",
    ],
  },
]

const implementationPhases = [
  {
    name: "Fase Inicial",
    timeline: "1-3 meses",
    items: [
      "Ambiente de desenvolvimento local",
      "Documentação viva",
      "Análise de segurança contínua",
      "Cache distribuído básico",
    ],
  },
  {
    name: "Fase Intermediária",
    timeline: "3-6 meses",
    items: ["API Gateway", "Telemetria avançada", "Sistema de plugins (fundação)", "Webhooks bidirecionais"],
  },
  {
    name: "Fase Avançada",
    timeline: "6-12 meses",
    items: [
      "Microsserviços para áreas críticas",
      "IA para previsão de demanda",
      "Integração com marketplaces",
      "Sharding geográfico",
    ],
  },
]

import { ArrowRightIcon as ArrowsOutCardinal, Code2, Eye } from "lucide-react"
