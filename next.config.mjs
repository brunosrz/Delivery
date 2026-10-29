/** @type {import('next').NextConfig} */
const nextConfig = {
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
}

export default nextConfig
