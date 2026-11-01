import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

// lib/paraglide é código gerado pelo compilador do Paraglide (bun run i18n): não é revisado nem formatado.
const eslintConfig = [{ ignores: ["lib/paraglide/**"] }, ...compat.extends("next/core-web-vitals", "next/typescript")]

export default eslintConfig
