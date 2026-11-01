import { describe, expect, it } from "vitest"
import nextConfig from "../../next.config.mjs"

type WebpackConfig = { resolve: { extensionAlias?: Record<string, string[]> } }
const webpack = nextConfig.webpack as (config: WebpackConfig) => WebpackConfig

describe("next.config webpack", () => {
  it("resolve imports .js dos pacotes do workspace para fontes TypeScript", () => {
    const config = webpack({ resolve: {} })
    expect(config.resolve.extensionAlias?.[".js"]).toEqual([".ts", ".tsx", ".js"])
  })

  it("preserva aliases de extensão já existentes", () => {
    const config = webpack({ resolve: { extensionAlias: { ".mjs": [".mts", ".mjs"] } } })
    expect(config.resolve.extensionAlias?.[".mjs"]).toEqual([".mts", ".mjs"])
    expect(config.resolve.extensionAlias?.[".js"]).toBeDefined()
  })

  it("compila os pacotes do workspace", () => {
    expect(nextConfig.transpilePackages).toEqual(["@delivery/domain", "@delivery/contracts"])
  })
})
