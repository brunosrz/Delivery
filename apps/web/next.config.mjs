const isDev = process.env.NODE_ENV !== "production"

/**
 * Política de segurança de conteúdo. Scripts e estilos inline continuam permitidos porque o Next injeta o script de
 * hidratação inline; trocar por nonce por requisição é o próximo passo de endurecimento. O resto é fechado: só a
 * própria origem, sem frames, sem plugins, formulários só para o próprio site.
 */
export const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ")

export const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Geolocalização só para o próprio site (o app do entregador); câmera, microfone e pagamento do navegador, nunca.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), geolocation=(self), interest-cohort=()" },
]

/** Páginas com dado de conta ou de pedido não ficam em cache de navegador nem de intermediários. */
export const privatePaths = [
  "/delivery-express/profile/:path*",
  "/delivery-express/orders/:path*",
  "/delivery-express/checkout/:path*",
  "/pedidos-na-mao/:path*",
  "/ta-na-entrega/:path*",
  "/mkit/materiais/:path*",
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      ...privatePaths.map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      })),
    ]
  },
  // Pacotes do workspace são publicados como TypeScript e compilados pelo Next.
  transpilePackages: ["@delivery/domain", "@delivery/contracts"],
  // O lint roda como gate próprio (`bun run lint --max-warnings 0`). Dentro do
  // `next build` o carregador legado de plugins não resolve o
  // eslint-plugin-react-hooks no layout de `node_modules` isolado. A checagem de tipos
  // do build continua ativa.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Os pacotes do workspace usam imports ESM com extensão ".js" apontando para fontes ".ts".
  webpack: (config) => {
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"], ...config.resolve.extensionAlias }
    return config
  },
}

export default nextConfig
