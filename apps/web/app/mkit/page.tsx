import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, FileCode2, Layers, PaintBucket, Store } from "lucide-react"

export default function MKitPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
          <Store className="h-8 w-8" />
          MKit - Kit de Marketing
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl">
          Conjunto completo de recursos de marketing digital e físico oferecido gratuitamente aos restaurantes parceiros
          da plataforma.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="components">Componentes</TabsTrigger>
          <TabsTrigger value="implementation">Implementação</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Objetivos Estratégicos
                </CardTitle>
                <CardDescription>Principais objetivos do MKit para restaurantes parceiros</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {strategicObjectives.map((objective, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <div className="min-w-5 flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{objective.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{objective.description}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Benefícios para Restaurantes
                </CardTitle>
                <CardDescription>Como o MKit ajuda os restaurantes parceiros</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {restaurantBenefits.map((benefit, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <div className="mt-0.5">{benefit.icon}</div>
                      <div>
                        <div className="font-medium">{benefit.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{benefit.description}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Roadmap de Evolução</CardTitle>
              <CardDescription>Plano de desenvolvimento e expansão do MKit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roadmapPhases.map((phase, index) => (
                  <div key={phase.name} className="border rounded-lg p-4 relative">
                    <div className="absolute -top-3 -left-3 bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <h3 className="font-bold mb-2 mt-1">{phase.name}</h3>
                    <ul className="text-sm space-y-1 list-disc list-inside text-gray-600 dark:text-gray-400">
                      {phase.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PaintBucket className="h-5 w-5" />
                  Categorização por Culinária
                </CardTitle>
                <CardDescription>Templates específicos para diferentes tipos de culinária</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {culinaryCategories.map((category) => (
                    <div
                      key={category.name}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Badge className={category.badgeColor}>{category.name}</Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{category.focus}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Calendário Sazonal
                </CardTitle>
                <CardDescription>Materiais temáticos para datas comemorativas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {seasonalDates.map((month) => (
                    <div key={month.name} className="border rounded-md p-2">
                      <div className="font-medium mb-1">{month.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{month.events}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm">
                  <a href="/mkit/calendario" className="underline">
                    Baixar o calendário comercial do ano (.ics)
                  </a>{" "}
                  para importar no Google Agenda, Outlook ou Apple Calendário.
                </p>
                <p className="mt-2 text-sm">
                  Equipe do restaurante:{" "}
                  <a href="/mkit/materiais" className="underline">
                    gerenciar materiais de marketing
                  </a>
                  .
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode2 className="h-5 w-5" />
                  Guias e Tutoriais
                </CardTitle>
                <CardDescription>Recursos educacionais para maximizar o uso do MKit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tutorialResources.map((resource) => (
                    <div
                      key={resource.name}
                      className="flex items-start gap-2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <div className="mt-0.5">{resource.icon}</div>
                      <div>
                        <div className="font-medium">{resource.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{resource.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Digital</CardTitle>
                <CardDescription>Materiais para presença online e comunicação digital</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {digitalMarketingMaterials.map((category) => (
                    <div key={category.name} className="border rounded-lg p-3">
                      <h3 className="font-medium mb-2">{category.name}</h3>
                      <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                        {category.items.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Marketing Físico</CardTitle>
                <CardDescription>Materiais para presença física e experiência no local</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {physicalMarketingMaterials.map((category) => (
                    <div key={category.name} className="border rounded-lg p-3">
                      <h3 className="font-medium mb-2">{category.name}</h3>
                      <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                        {category.items.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="implementation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Plataforma de Distribuição</CardTitle>
                <CardDescription>Como os materiais são disponibilizados aos restaurantes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <h3 className="font-medium mb-2">Seção Dedicada no Painel</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Área exclusiva no painel administrativo do restaurante para acesso aos materiais do MKit.
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="text-xs border rounded p-2 bg-slate-50 dark:bg-slate-800">
                        <span className="font-medium">Organização por categorias</span>
                      </div>
                      <div className="text-xs border rounded p-2 bg-slate-50 dark:bg-slate-800">
                        <span className="font-medium">Sistema de busca e filtragem</span>
                      </div>
                      <div className="text-xs border rounded p-2 bg-slate-50 dark:bg-slate-800">
                        <span className="font-medium">Visualização prévia</span>
                      </div>
                      <div className="text-xs border rounded p-2 bg-slate-50 dark:bg-slate-800">
                        <span className="font-medium">Download em alta resolução</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h3 className="font-medium mb-2">Integração com Ferramentas</h3>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Links diretos para edição no Canva</li>
                      <li>Arquivos Figma para personalização avançada</li>
                      <li>Exportação em múltiplos formatos (PNG, JPG, PDF, SVG)</li>
                      <li>Integração com serviços de impressão parceiros</li>
                    </ul>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h3 className="font-medium mb-2">Personalização Automática</h3>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Aplicação automática de logo e cores do restaurante</li>
                      <li>Substituição inteligente de textos</li>
                      <li>Geração de QR codes específicos para cada restaurante</li>
                      <li>Adaptação para diferentes tamanhos e formatos</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parcerias Estratégicas</CardTitle>
                <CardDescription>Ecossistema de parceiros para potencializar o MKit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <h3 className="font-medium mb-2">Agências de Marketing Digital</h3>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Diretório de agências parceiras verificadas</li>
                      <li>Benefícios especiais para restaurantes da plataforma</li>
                      <li>Acesso a recursos exclusivos do MKit</li>
                      <li>Treinamento especializado para trabalhar com o MKit</li>
                    </ul>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h3 className="font-medium mb-2">Gráficas e Serviços de Impressão</h3>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Rede de gráficas parceiras em diferentes regiões</li>
                      <li>Preços especiais para restaurantes da plataforma</li>
                      <li>Integração para orçamentos e pedidos diretos</li>
                      <li>Garantia de qualidade e prazos</li>
                    </ul>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h3 className="font-medium mb-2">Métricas de Sucesso</h3>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Taxa de utilização dos materiais pelos restaurantes</li>
                      <li>Conversão de clientes de marketplaces para o canal próprio</li>
                      <li>Feedback dos restaurantes sobre facilidade de uso</li>
                      <li>Impacto nas vendas após implementação dos materiais</li>
                      <li>Crescimento da rede de parceiros (agências e gráficas)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Implementação Técnica</CardTitle>
              <CardDescription>Aspectos técnicos da implementação do MKit na plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Frontend</h3>
                  <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Interface de navegação por categorias e temas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Visualizador de templates com personalização em tempo real</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Editor básico para ajustes simples</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Integração com APIs de Canva e Figma</span>
                    </li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Backend</h3>
                  <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>API para gerenciamento de templates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Sistema de armazenamento de assets otimizado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Geração dinâmica de QR codes personalizados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Integração com APIs de serviços de impressão</span>
                    </li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Infraestrutura</h3>
                  <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>CDN para distribuição global de assets</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Processamento de imagens sob demanda</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Sistema de cache para templates populares</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Monitoramento de uso e performance</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const strategicObjectives = [
  {
    title: "Profissionalizar a imagem dos restaurantes parceiros",
    description:
      "Elevar o padrão visual e de comunicação dos estabelecimentos com materiais de qualidade profissional.",
  },
  {
    title: "Facilitar a transição de clientes do iFood para o app/site próprio",
    description: "Criar estratégias e materiais específicos para migrar clientes de marketplaces tradicionais.",
  },
  {
    title: "Criar uma experiência de marca consistente entre digital e físico",
    description: "Garantir que a identidade visual seja coerente em todos os pontos de contato com o cliente.",
  },
  {
    title: "Reduzir a barreira de entrada para marketing profissional",
    description:
      "Democratizar o acesso a materiais de marketing de alta qualidade, especialmente para pequenos negócios.",
  },
  {
    title: "Fortalecer o ecossistema de parceiros",
    description: "Criar oportunidades para agências de marketing e gráficas locais através de parcerias estratégicas.",
  },
]

const restaurantBenefits = [
  {
    title: "Economia de custos",
    description: "Acesso gratuito a materiais que normalmente custariam milhares de reais para desenvolver.",
    icon: <DollarSign className="h-5 w-5 text-green-500" />,
  },
  {
    title: "Aumento de conversão",
    description: "Materiais profissionais que aumentam a taxa de conversão e o valor médio dos pedidos.",
    icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
  },
  {
    title: "Fidelização de clientes",
    description: "Estratégias e materiais específicos para criar relacionamento duradouro com clientes.",
    icon: <Heart className="h-5 w-5 text-red-500" />,
  },
  {
    title: "Diferenciação da concorrência",
    description: "Presença de marca profissional que destaca o restaurante no mercado local.",
    icon: <Award className="h-5 w-5 text-purple-500" />,
  },
]

const roadmapPhases = [
  {
    name: "Fase 1: Lançamento Inicial",
    items: [
      "Templates básicos para principais categorias",
      "Guias fundamentais de implementação",
      "Parcerias iniciais com agências e gráficas",
    ],
  },
  {
    name: "Fase 2: Expansão",
    items: [
      "Ampliação do número de templates",
      "Adição de novas categorias culinárias",
      "Implementação do calendário sazonal completo",
      "Expansão da rede de parceiros",
    ],
  },
  {
    name: "Fase 3: Personalização Avançada",
    items: [
      "IA para geração de conteúdo personalizado",
      "Análise de desempenho dos materiais",
      "Recomendações baseadas em dados",
      "Integração com plataformas adicionais",
    ],
  },
]

const culinaryCategories = [
  {
    name: "Pizzarias",
    focus: "Combinações, promoções de rodízio e delivery rápido",
    badgeColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
  {
    name: "Hamburguerias",
    focus: "Ingredientes premium e combos",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  },
  {
    name: "Culinária Japonesa",
    focus: "Frescor, apresentação visual e combinações",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    name: "Comida Brasileira",
    focus: "Pratos tradicionais e porções generosas",
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  {
    name: "Cafeterias",
    focus: "Ambiente, experiência e produtos artesanais",
    badgeColor: "bg-brown-100 text-brown-800 dark:bg-brown-900 dark:text-brown-300",
  },
  {
    name: "Doceria/Confeitaria",
    focus: "Apresentação visual e ocasiões especiais",
    badgeColor: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  },
  {
    name: "Culinária Saudável",
    focus: "Ingredientes, valores nutricionais e bem-estar",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  },
]

const seasonalDates = [
  { name: "Janeiro", events: "Ano Novo, Férias de Verão" },
  { name: "Fevereiro", events: "Carnaval, Dia dos Namorados (14/02)" },
  { name: "Março", events: "Dia da Mulher, Início do Outono" },
  { name: "Abril", events: "Páscoa, Dia do Café (24/04)" },
  { name: "Maio", events: "Dia das Mães, Dia do Hambúrguer (28/05)" },
  { name: "Junho", events: "Festas Juninas, Dia dos Namorados (12/06)" },
  { name: "Julho", events: "Férias de Inverno, Dia da Pizza (10/07)" },
  { name: "Agosto", events: "Dia dos Pais" },
  { name: "Setembro", events: "Primavera, Dia do Cliente (15/09)" },
  { name: "Outubro", events: "Dia das Crianças, Halloween" },
  { name: "Novembro", events: "Black Friday" },
  { name: "Dezembro", events: "Natal, Ano Novo, Férias de Verão" },
]

const tutorialResources = [
  {
    name: "Vídeos tutoriais",
    description: "Passo a passo para personalização dos templates",
    icon: <Video className="h-5 w-5 text-red-500" />,
  },
  {
    name: "Guias em PDF",
    description: "Documentação detalhada com melhores práticas",
    icon: <FileText className="h-5 w-5 text-blue-500" />,
  },
  {
    name: "Webinars mensais",
    description: "Sessões ao vivo com especialistas em marketing",
    icon: <MonitorPlay className="h-5 w-5 text-purple-500" />,
  },
  {
    name: "Base de conhecimento",
    description: "Artigos e FAQs sobre estratégias de marketing",
    icon: <BookOpen className="h-5 w-5 text-green-500" />,
  },
]

const digitalMarketingMaterials = [
  {
    name: "Redes Sociais",
    items: [
      "Templates para feed do Instagram (mínimo 20 por categoria)",
      "Templates para Stories (mínimo 15 por categoria)",
      "Capas para Facebook e LinkedIn",
      "Templates para posts no TikTok",
      "Legendas sugeridas e hashtags recomendadas",
    ],
  },
  {
    name: "E-mail Marketing",
    items: [
      "Templates para newsletter",
      "Sequências de e-mails para clientes novos",
      "Campanhas para clientes inativos",
      "Anúncios de novos pratos e promoções",
    ],
  },
  {
    name: "Site e Aplicativo",
    items: [
      "Banners promocionais",
      "Pop-ups para ofertas especiais",
      "Elementos para destaque de pratos",
      "Badges para novidades e promoções",
    ],
  },
]

const physicalMarketingMaterials = [
  {
    name: "Embalagens",
    items: [
      "Designs para caixas de pizza",
      "Adesivos para embalagens de delivery",
      "Sacolas personalizáveis",
      "Embalagens para diferentes tipos de alimentos",
      "QR codes integrados direcionando para o site/app",
    ],
  },
  {
    name: "Material para o Estabelecimento",
    items: [
      "Displays de mesa com QR code",
      "Cardápios impressos personalizáveis",
      "Cartazes para área de espera",
      "Uniformes para equipe (camisetas, aventais)",
      "Placas de sinalização",
    ],
  },
  {
    name: "Material Promocional",
    items: [
      "Cartões de visita",
      "Flyers promocionais",
      "Ímãs de geladeira",
      "Cartões de fidelidade",
      "Brindes personalizáveis",
    ],
  },
]

import { Award, BookOpen, DollarSign, FileText, Heart, MonitorPlay, TrendingUp, Video } from "lucide-react"
