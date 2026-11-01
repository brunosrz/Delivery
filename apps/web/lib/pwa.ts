import type { MetadataRoute } from "next"

export type PwaApp = "pedidos-na-mao" | "ta-na-entrega"

const APPS = {
  "pedidos-na-mao": {
    name: "Pedidos na Mão",
    description: "Fila de pedidos do restaurante em tempo real.",
    color: "#ea580c",
    icon: "pedidos",
  },
  "ta-na-entrega": {
    name: "Tá na Entrega",
    description: "Entregas prontas para retirar e concluir.",
    color: "#15803d",
    icon: "entrega",
  },
} as const

/** URL do manifesto: fora das rotas protegidas, porque o navegador o busca sem cookie de sessão. */
export const manifestUrl = (app: PwaApp) => `/pwa/${app}/manifest.webmanifest`

/** Escopo e página inicial do app instalado: o escopo mantém o app dentro da própria rota. */
export function buildManifest(app: PwaApp): MetadataRoute.Manifest {
  const { name, description, color, icon } = APPS[app]
  return {
    name,
    short_name: name,
    description,
    lang: "pt-BR",
    start_url: `/${app}`,
    scope: `/${app}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#fffaf0",
    theme_color: color,
    icons: [
      { src: `/pwa/${icon}-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/pwa/${icon}-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `/pwa/${icon}-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
