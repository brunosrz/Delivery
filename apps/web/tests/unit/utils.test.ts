import { describe, expect, it } from "vitest"
import { cn, formatCents } from "@/lib/utils"

describe("formatCents", () => {
  it.each([
    [0, "R$ 0,00"],
    [790, "R$ 7,90"],
    [4590, "R$ 45,90"],
    [123456, "R$ 1.234,56"],
  ])("%d centavos -> %s", (cents, expected) => {
    expect(formatCents(cents).replace(/ /g, " ")).toBe(expected)
  })
})

describe("cn", () => {
  it("resolve conflitos de classes do Tailwind", () => {
    expect(cn("p-2", false, "p-4")).toBe("p-4")
  })
})
