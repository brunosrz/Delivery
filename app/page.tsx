import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Code2, Database, FileCode2, GitFork, Layers, LayoutDashboard, Rocket, Store } from "lucide-react"

export default function ArchitectureDashboard() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4">Delivery by Sorz</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Plataforma completa para delivery e gestão de restaurantes com arquitetura moderna e escalável
        </p>
      </div>

      {/* Cartões dos Protótipos no início */}
      <div className="mb-10">
        {/* Primeiros 4 projetos em um grid de 2x2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-2 border-red-100 hover:border-red-300 transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="text-red-600">Delivery Express</CardTitle>
              <CardDescription>
                Interface para clientes fazerem pedidos, visualizarem o cardápio e acompanharem o status dos pedidos.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="aspect-video relative mb-4 rounded-md overflow-hidden bg-gray-100">
                <Image
                  src="/food-delivery-app-interface.png"
                  alt="Interface do Delivery Express"
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/delivery-express" className="w-full">
                <Button className="w-full bg-red-400 group-hover:bg-red-500 hover:!bg-red-600 text-white transition-colors duration-300">
                  Acessar Delivery Express
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="bg-white border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="text-blue-600">Pedidos na Mão</CardTitle>
              <CardDescription>
                Painel administrativo para gerenciar cardápio, pedidos, configurações e estatísticas do restaurante.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="aspect-video relative mb-4 rounded-md overflow-hidden bg-gray-100">
                <Image
                  src="/restaurant-management-dashboard.png"
                  alt="Interface do Pedidos na Mão"
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/pedidos-na-mao" className="w-full">
                <Button className="w-full bg-blue-400 group-hover:bg-blue-500 hover:!bg-blue-600 text-white transition-colors duration-300">
                  Acessar Pedidos na Mão
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="bg-white border-2 border-orange-100 hover:border-orange-300 transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="text-orange-600">Vitrine</CardTitle>
              <CardDescription>
                Apresentação do sistema Sorz para restaurantes interessados em ter seu próprio sistema de delivery.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="aspect-video relative mb-4 rounded-md overflow-hidden bg-gray-100">
                <Image src="/restaurant-showcase.png" alt="Interface da Vitrine" fill className="object-cover" />
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/vitrine" className="w-full">
                <Button className="w-full bg-orange-400 group-hover:bg-orange-500 hover:!bg-orange-600 text-white transition-colors duration-300">
                  Acessar Vitrine
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="bg-white border-2 border-green-100 hover:border-green-300 transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="text-green-600">Tá na Entrega</CardTitle>
              <CardDescription>
                Aplicativo para entregadores gerenciarem entregas, rotas e recebimentos de pedidos em tempo real.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="aspect-video relative mb-4 rounded-md overflow-hidden bg-gray-100">
                <Image
                  src="/food-delivery-driver-app.png"
                  alt="Interface do Tá na Entrega"
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/ta-na-entrega" className="w-full">
                <Button className="w-full bg-green-400 group-hover:bg-green-500 hover:!bg-green-600 text-white transition-colors duration-300">
                  Acessar Tá na Entrega
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Segunda linha com três colunas em telas grandes, duas em médias e uma em pequenas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Coluna da esquerda - Administrativo e Casa das Máquinas (um em cima do outro em telas grandes) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Card Administrativo */}
            <Card className="bg-white border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 flex-1 group">
              <CardHeader>
                <CardTitle className="text-purple-600">Administrativo</CardTitle>
                <CardDescription>
                  Painel de super usuário para administração global do sistema, gerenciamento de restaurantes e
                  configurações avançadas.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="aspect-video relative mb-4 rounded-md overflow-hidden bg-gray-100">
                  <Image
                    src="/admin-dashboard-interface.png"
                    alt="Interface do Administrativo"
                    fill
                    className="object-cover"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/administrativo" className="w-full">
                  <Button className="w-full bg-purple-400 group-hover:bg-purple-500 hover:!bg-purple-600 text-white transition-colors duration-300">
                    Acessar Administrativo
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Card Casa das Máquinas */}
            <Card className="bg-white border-2 border-gray-100 hover:border-gray-300 transition-all duration-300 flex-1 flex flex-col group">
              <CardHeader>
                <CardTitle className="text-gray-600 flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Casa das Máquinas
                </CardTitle>
                <CardDescription>
                  Backend centralizado que fornece APIs para todos os módulos do sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Backend centralizado construído com Next.js API Routes, fornecendo APIs para todos os módulos do
                  sistema. Utiliza tRPC para comunicação tipada, PostgreSQL com Prisma como ORM, e implementa
                  arquitetura multi-tenant com isolamento de dados. A autenticação é gerenciada pelo NextAuth.js e o
                  controle de permissões pelo CASL, garantindo segurança e escalabilidade.
                </p>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button
                  className="w-full bg-gray-400 group-hover:bg-gray-500 hover:!bg-gray-600 text-white transition-colors duration-300"
                  disabled
                >
                  <span className="group-hover:opacity-80 transition-opacity duration-300">Somente API</span>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Coluna da direita - Arquitetura (ocupa 2 colunas em telas grandes) */}
          <div className="lg:col-span-2 flex flex-col">
            <Tabs defaultValue="current" className="w-full flex flex-col h-full">
              <div className="mb-2 bg-white border border-gray-300 hover:border-black rounded-md p-1 transition-colors duration-300">
                <TabsList className="bg-transparent w-full h-full flex-col sm:flex-row">
                  <TabsTrigger
                    value="current"
                    className="w-full py-2 px-4 rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm hover:bg-gray-100 data-[state=active]:hover:bg-blue-100 transition-all duration-300 mb-1 sm:mb-0"
                  >
                    <span className="block">Atual</span>
                  </TabsTrigger>
                  <div className="hidden sm:block w-[1px] h-auto self-stretch bg-gray-200 mx-1"></div>
                  <div className="block sm:hidden h-[1px] w-full bg-gray-200 my-1"></div>
                  <TabsTrigger
                    value="future"
                    className="w-full py-2 px-4 rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm hover:bg-gray-100 data-[state=active]:hover:bg-blue-100 transition-all duration-300"
                  >
                    <span className="block">Futura</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="current" className="flex-grow">
                <Card className="bg-white h-full border-2 border-gray-100 hover:border-gray-300 transition-all duration-300 group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Estrutura Atual com App Router
                    </CardTitle>
                    <CardDescription>
                      Abordagem simplificada usando Next.js App Router com todos os projetos em um único aplicativo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-x-auto h-full border border-gray-100 hover:border-gray-300 transition-all duration-300">
                      <pre className="text-sm whitespace-pre" style={{ minWidth: "600px" }}>
                        {`/app
  /page.tsx                # Página principal com lista de projetos
  /layout.tsx              # Layout compartilhado por todos os projetos
  /vitrine                 # Vitrine - Site de apresentação dos restaurantes
  /delivery-express        # Aplicativo para clientes finais
  /pedidos-na-mao          # Pedidos na Mão - Sistema para restaurantes
  /ta-na-entrega           # Tá na Entrega - Aplicativo para entregadores
  /administrativo          # Administrativo - Painel administrativo
  /casa-das-maquinas       # Casa das Máquinas - Backend/API
    /api                   # Rotas de API
/components                # Componentes compartilhados
/lib                       # Utilitários e funções compartilhadas
/public                    # Arquivos estáticos`}
                      </pre>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 hover:border-green-400 dark:border-green-800 transition-colors duration-300"
                      >
                        Simplicidade
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 hover:border-blue-400 dark:border-blue-800 transition-colors duration-300"
                      >
                        Compartilhamento de Código
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 hover:border-purple-400 dark:border-purple-800 transition-colors duration-300"
                      >
                        Navegação Fluida
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 hover:border-amber-400 dark:border-amber-800 transition-colors duration-300"
                      >
                        Deploy Único
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border border-pink-200 hover:border-pink-400 dark:border-pink-800 transition-colors duration-300"
                      >
                        v0.dev First
                      </Badge>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="future" className="flex-grow">
                <Card className="bg-white h-full border-2 border-gray-100 hover:border-gray-300 transition-all duration-300 group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitFork className="h-5 w-5" />
                      Estrutura Futura com Monorepo
                    </CardTitle>
                    <CardDescription>
                      Arquitetura escalável usando Turborepo para gerenciar múltiplas aplicações e pacotes
                      compartilhados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-x-auto h-full border border-gray-100 hover:border-gray-300 transition-all duration-300">
                      <pre className="text-sm whitespace-pre" style={{ minWidth: "600px" }}>
                        {`/
├── apps/                      # Aplicações independentes
│   ├── vitrine/               # Vitrine - Site de apresentação
│   ├── delivery-express/      # Delivery Express - Aplicativo para clientes
│   ├── pedidos-na-mao/        # Pedidos na Mão - Sistema para restaurantes
│   ├── ta-na-entrega/         # Tá na Entrega - Aplicativo para entregadores
│   ├── administrativo/        # Administrativo - Painel administrativo
│   └── casa-das-maquinas/     # Casa das Máquinas - Backend centralizado com APIs
│
├── packages/                  # Pacotes compartilhados
│   ├── ui/                    # Biblioteca de componentes UI
│   ├── config/                # Configurações compartilhadas
│   ├── tsconfig/              # Configurações TypeScript
│   ├── eslint-config/         # Configurações ESLint
│   ├── utils/                 # Utilitários e funções compartilhadas
│   ├── api-client/            # Cliente de API
│   ├── auth/                  # Lógica de autenticação
│   └── types/                 # Tipos TypeScript compartilhados
│
├── docs/                      # Documentação do projeto
├── turbo.json                 # Configuração do Turborepo
└── pnpm-workspace.yaml        # Configuração do workspace PNPM`}
                      </pre>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 hover:border-green-400 dark:border-green-800 transition-colors duration-300"
                      >
                        Escalabilidade
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 hover:border-blue-400 dark:border-blue-800 transition-colors duration-300"
                      >
                        Deploys Independentes
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 hover:border-purple-400 dark:border-purple-800 transition-colors duration-300"
                      >
                        Builds Otimizados
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 hover:border-amber-400 dark:border-amber-800 transition-colors duration-300"
                      >
                        Código Compartilhado
                      </Badge>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6">Componentes Especiais</h2>
        <div className="flex flex-wrap gap-6">
          <Card className="bg-white flex-1 min-w-[280px] flex flex-col border-2 border-gray-100 hover:border-gray-300 transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Casa das Máquinas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-4">
                <ul className="text-sm space-y-2 list-disc list-inside text-gray-600 dark:text-gray-400">
                  <li>API First com contratos bem definidos e documentados</li>
                  <li>Multi-tenant por design com isolamento completo de dados entre clientes</li>
                  <li>Tipagem forte de ponta a ponta com tRPC para comunicação segura</li>
                  <li>Segurança em camadas com autenticação, autorização e validação</li>
                  <li>Observabilidade integrada com logs, métricas e rastreamento</li>
                  <li>Escalabilidade horizontal para suportar crescimento contínuo</li>
                  <li>Migrações de banco de dados automatizadas e versionadas</li>
                  <li>Cache inteligente para otimização de performance</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                className="w-full bg-gray-400 group-hover:bg-gray-500 hover:!bg-gray-600 text-white transition-colors duration-300"
                disabled
              >
                <span className="group-hover:opacity-80 transition-opacity duration-300">Somente API</span>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white flex-1 min-w-[280px] flex flex-col border-2 border-gray-100 hover:border-gray-300 transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                MKit - Kit de Marketing
              </CardTitle>
              <CardDescription>Recursos de marketing digital e físico para restaurantes parceiros</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Componentes Principais</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside text-gray-600 dark:text-gray-400">
                    <li>Templates específicos por tipo de culinária</li>
                    <li>Calendário sazonal de marketing</li>
                    <li>Guias de implementação e tutoriais</li>
                    <li>Materiais para marketing digital e físico</li>
                    <li>Integração com ferramentas como Canva e Figma</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Objetivos Estratégicos</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside text-gray-600 dark:text-gray-400">
                    <li>Profissionalizar a imagem dos restaurantes</li>
                    <li>Facilitar a transição de clientes do iFood</li>
                    <li>Criar experiência de marca consistente</li>
                    <li>Reduzir barreira de entrada para marketing</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                className="w-full bg-orange-400 group-hover:bg-orange-500 hover:!bg-orange-600 text-white transition-colors duration-300"
                disabled
              >
                <span className="group-hover:opacity-80 transition-opacity duration-300">Em Desenvolvimento</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Footer with dark background and white text */}
      <footer className="mt-16 py-6 px-4 bg-gray-900 text-white rounded-lg border-2 border-gray-900 hover:border-gray-700 transition-colors duration-300">
        <div className="container mx-auto text-center">
          <p className="mb-2">© 2023 Delivery by Sorz. Todos os direitos reservados.</p>
          <p className="text-sm text-gray-400">Desenvolvido com Next.js, TailwindCSS e Turborepo</p>
        </div>
      </footer>
    </div>
  )
}

const futureApps = [
  {
    name: "vitrine",
    description: "Vitrine - Site de apresentação dos restaurantes parceiros",
    icon: <Store className="h-5 w-5 text-orange-500" />,
  },
  {
    name: "delivery-express",
    description: "Delivery Express - Aplicativo web para clientes finais realizarem pedidos",
    icon: <Rocket className="h-5 w-5 text-red-500" />,
  },
  {
    name: "pedidos-na-mao",
    description: "Pedidos na Mão - Sistema para restaurantes gerenciarem seus pedidos",
    icon: <LayoutDashboard className="h-5 w-5 text-blue-500" />,
  },
  {
    name: "ta-na-entrega",
    description: "Tá na Entrega - Aplicativo para entregadores parceiros",
    icon: <Rocket className="h-5 w-5 text-green-500" />,
  },
  {
    name: "administrativo",
    description: "Administrativo - Painel administrativo para gestão da plataforma",
    icon: <LayoutDashboard className="h-5 w-5 text-purple-500" />,
  },
  {
    name: "casa-das-maquinas",
    description: "Casa das Máquinas - Backend centralizado com APIs",
    icon: <Database className="h-5 w-5 text-gray-500" />,
  },
]

const futurePackages = [
  {
    name: "ui",
    description: "Biblioteca de componentes compartilhados",
    icon: <Code2 className="h-5 w-5 text-purple-500" />,
  },
  {
    name: "config",
    description: "Configurações compartilhadas",
    icon: <FileCode2 className="h-5 w-5 text-purple-500" />,
  },
  {
    name: "tsconfig",
    description: "Configurações TypeScript compartilhadas",
    icon: <FileCode2 className="h-5 w-5 text-purple-500" />,
  },
  {
    name: "eslint-config",
    description: "Configurações ESLint compartilhadas",
    icon: <FileCode2 className="h-5 w-5 text-purple-500" />,
  },
  {
    name: "utils",
    description: "Utilitários e funções auxiliares compartilhadas",
    icon: <Code2 className="h-5 w-5 text-purple-500" />,
  },
  {
    name: "api-client",
    description: "Cliente para consumir as APIs da Casa das Máquinas",
    icon: <Database className="h-5 w-5 text-purple-500" />,
  },
  {
    name: "auth",
    description: "Lógica de autenticação compartilhada",
    icon: <Code2 className="h-5 w-5 text-purple-500" />,
  },
  {
    name: "types",
    description: "Tipos TypeScript compartilhados",
    icon: <FileCode2 className="h-5 w-5 text-purple-500" />,
  },
]

const migrationPhases = [
  {
    name: "Preparação",
    tasks: [
      "Identificar componentes compartilhados",
      "Refatorar código para minimizar acoplamento",
      "Padronizar interfaces entre projetos",
    ],
  },
  {
    name: "Criação da Estrutura",
    tasks: [
      "Configurar Turborepo e PNPM workspaces",
      "Criar pacotes compartilhados básicos",
      "Configurar CI/CD para o monorepo",
    ],
  },
  {
    name: "Migração dos Projetos",
    tasks: [
      "Migrar um projeto por vez",
      "Adaptar imports para usar pacotes compartilhados",
      "Testar cada projeto após migração",
    ],
  },
  {
    name: "Refinamento",
    tasks: ["Otimizar builds e caches", "Implementar testes automatizados", "Documentar processo de desenvolvimento"],
  },
]
