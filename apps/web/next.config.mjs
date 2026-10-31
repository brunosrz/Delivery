/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pacotes do workspace são publicados como TypeScript e compilados pelo Next.
  transpilePackages: ["@delivery/domain", "@delivery/contracts"],
  // O lint roda como gate próprio (`pnpm lint --max-warnings 0`). Dentro do
  // `next build` o carregador legado de plugins não resolve o
  // eslint-plugin-react-hooks no layout estrito do pnpm. A checagem de tipos
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
