import { existsSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { ECOSYSTEM_PRODUCTS, STATE_LABELS } from "@/lib/ecosystem-status"

const appDir = path.resolve(__dirname, "../../app")

describe("ECOSYSTEM_PRODUCTS", () => {
  it.each(ECOSYSTEM_PRODUCTS.map((product) => [product.id, product.route]))(
    "%s aponta para uma página existente (%s)",
    (_id, route) => {
      expect(existsSync(path.join(appDir, route, "page.tsx"))).toBe(true)
    },
  )

  it("usa ids únicos e estados conhecidos", () => {
    const ids = ECOSYSTEM_PRODUCTS.map((product) => product.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const product of ECOSYSTEM_PRODUCTS) {
      expect(Object.keys(STATE_LABELS)).toContain(product.state)
    }
  })

  it("não declara nada como implementado sem listar limitações ou issues", () => {
    for (const product of ECOSYSTEM_PRODUCTS) {
      expect(product.issues.length).toBeGreaterThan(0)
      if (product.state !== "implementado") {
        expect(product.limitations.length).toBeGreaterThan(0)
      }
    }
  })
})
