import js from "@eslint/js"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["coverage/**", ".wrangler/**", "src/worker-configuration.d.ts"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
)
