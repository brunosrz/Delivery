import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

// lib/paraglide (bun run i18n) e dist, .vinext, .wrangler (vite build, wrangler) são código gerado: não são revisados nem formatados.
const eslintConfig = [
  { ignores: ["lib/paraglide/**", "dist/**", ".vinext/**", ".wrangler/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
]

export default eslintConfig
