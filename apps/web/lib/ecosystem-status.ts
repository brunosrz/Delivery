// Fonte única do estado real de cada produto do ecossistema.
// Alimenta a página inicial e o inventário em docs/estado-atual.md; o teste
// tests/unit/ecosystem-status.test.ts garante que toda rota listada existe.

export type CapabilityState = "implementado" | "parcial" | "demo" | "stub" | "planejado"

export type EcosystemProduct = {
  id: string
  name: string
  audience: string
  route: string
  state: CapabilityState
  summary: string
  limitations: string[]
  issues: number[]
}

export const STATE_LABELS: Record<CapabilityState, string> = {
  implementado: "Implementado",
  parcial: "Parcial",
  demo: "Demonstração",
  stub: "Em construção",
  planejado: "Planejado",
}

export const ECOSYSTEM_PRODUCTS: readonly EcosystemProduct[] = [
  {
    id: "delivery-express",
    name: "Delivery Express",
    audience: "Cliente",
    route: "/delivery-express",
    state: "parcial",
    summary:
      "Lista restaurantes, cardápio por seção e detalhe do produto com adicionais, via API da Casa das Máquinas.",
    limitations: ["Sacola, checkout e acompanhamento de pedido ainda não existem (#18)."],
    issues: [18, 3],
  },
  {
    id: "pedidos-na-mao",
    name: "Pedidos na Mão",
    audience: "Restaurante",
    route: "/pedidos-na-mao",
    state: "stub",
    summary: "Painel do restaurante para fila de pedidos, status e cardápio.",
    limitations: ["Hoje exibe apenas a lista de funcionalidades planejadas."],
    issues: [17],
  },
  {
    id: "ta-na-entrega",
    name: "Tá na Entrega",
    audience: "Entregador",
    route: "/ta-na-entrega",
    state: "stub",
    summary: "App do entregador para aceitar pedidos, retirar e entregar.",
    limitations: ["Hoje exibe apenas a lista de funcionalidades planejadas."],
    issues: [17],
  },
  {
    id: "site-institucional",
    name: "Site institucional",
    audience: "Público",
    route: "/site-institucional",
    state: "stub",
    summary: "Apresentação pública do ecossistema.",
    limitations: ["Contato e conteúdo comercial ainda não existem."],
    issues: [17],
  },
  {
    id: "mkit",
    name: "MKit",
    audience: "Restaurante",
    route: "/mkit",
    state: "demo",
    summary: "Conceito do kit de marketing para restaurantes parceiros.",
    limitations: ["Conteúdo estático; não há geração, personalização nem exportação."],
    issues: [12],
  },
  {
    id: "casa-das-maquinas",
    name: "Casa das Máquinas",
    audience: "Backend",
    route: "/casa-das-maquinas",
    state: "parcial",
    summary: "Backend centralizado em Cloudflare Workers com D1: API v1 de catálogo e OpenAPI.",
    limitations: [
      "Ainda não publicado; o Delivery Express já consome a API de catálogo.",
      "Pedidos, autenticação, tempo real e isolamento completo por tenant estão nas próximas etapas.",
    ],
    issues: [4, 1, 6, 14],
  },
]
