import type { AddonGroup } from "@delivery/contracts"
import { describe, expect, it } from "vitest"
import { type Cart, addLine, itemCount, loadCart, saveCart, setQuantity, toItems, validateSelection } from "@/lib/cart"

const burger = { id: "rest_burger", slug: "burger", name: "Burger" }
const pizza = { id: "rest_pizza", slug: "pizza", name: "Pizza" }
const line = (overrides: Partial<Parameters<typeof addLine>[2]> = {}) => ({
  productId: "prod_1",
  productName: "Burger clássico",
  quantity: 1,
  addonOptionIds: ["opt_b", "opt_a"],
  addonLabels: ["Bacon", "Ao ponto"],
  ...overrides,
})

describe("addLine", () => {
  it("cria a sacola do restaurante", () => {
    const cart = addLine(null, burger, line())
    expect(cart).toMatchObject({ restaurantId: "rest_burger", restaurantSlug: "burger" })
    expect(cart.lines).toHaveLength(1)
  })

  it("soma linhas iguais, ignorando a ordem dos adicionais, e respeita o limite do produto", () => {
    let cart = addLine(null, burger, line({ quantity: 2 }), 3)
    cart = addLine(cart, burger, line({ quantity: 5, addonOptionIds: ["opt_a", "opt_b"] }), 3)
    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0]?.quantity).toBe(3)
  })

  it("trata adicionais ou observações diferentes como linhas diferentes", () => {
    let cart = addLine(null, burger, line())
    cart = addLine(cart, burger, line({ addonOptionIds: ["opt_a"] }))
    cart = addLine(cart, burger, line({ notes: "sem cebola" }))
    expect(cart.lines).toHaveLength(3)
  })

  it("troca a sacola ao adicionar produto de outro restaurante", () => {
    const cart = addLine(addLine(null, burger, line()), pizza, line({ productId: "prod_9" }))
    expect(cart.restaurantId).toBe("rest_pizza")
    expect(cart.lines).toHaveLength(1)
  })

  it("nunca passa de 99 por linha", () => {
    expect(addLine(null, burger, line({ quantity: 500 })).lines[0]?.quantity).toBe(99)
  })
})

describe("setQuantity e itemCount", () => {
  const cart = addLine(addLine(null, burger, line({ quantity: 2 })), burger, line({ productId: "prod_2" })) as Cart

  it("atualiza a quantidade", () => {
    const key = cart.lines[0]?.key ?? ""
    expect(itemCount(setQuantity(cart, key, 4))).toBe(5)
  })

  it("zero remove a linha e esvaziar devolve null", () => {
    const [first, second] = cart.lines
    const afterFirst = setQuantity(cart, first?.key ?? "", 0)
    expect(afterFirst?.lines).toHaveLength(1)
    expect(setQuantity(afterFirst as Cart, second?.key ?? "", 0)).toBeNull()
    expect(itemCount(null)).toBe(0)
  })
})

describe("toItems", () => {
  it("envia só o necessário para o servidor recalcular o preço", () => {
    const cart = addLine(null, burger, line({ notes: "sem cebola" }))
    expect(toItems(cart)).toEqual([
      { productId: "prod_1", quantity: 1, addonOptionIds: ["opt_b", "opt_a"], notes: "sem cebola" },
    ])
  })
})

describe("validateSelection", () => {
  const option = (id: string) => ({ id, name: id, priceCents: 0, available: true })
  const groups: AddonGroup[] = [
    { id: "g1", name: "Ponto", minSelections: 1, maxSelections: 1, options: [option("a"), option("b")] },
    { id: "g2", name: "Extras", minSelections: 0, maxSelections: 2, options: [option("c"), option("d"), option("e")] },
  ]

  it("aceita escolhas dentro dos limites", () => {
    expect(validateSelection(groups, new Set(["a", "c", "d"]))).toEqual({})
  })

  it("exige o mínimo e recusa mais que o máximo", () => {
    expect(validateSelection(groups, new Set(["c", "d", "e"]))).toEqual({
      g1: "Escolha uma opção em Ponto",
      g2: "Escolha no máximo 2 em Extras",
    })
  })
})

describe("armazenamento", () => {
  const memory = () => {
    const data = new Map<string, string>()
    return {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
    }
  }

  it("grava e recupera a sacola; null remove", () => {
    const storage = memory()
    const cart = addLine(null, burger, line())
    saveCart(storage, cart)
    expect(loadCart(storage)).toEqual(cart)
    saveCart(storage, null)
    expect(loadCart(storage)).toBeNull()
  })

  it("trata conteúdo corrompido e armazenamento bloqueado como sacola vazia", () => {
    const corrupted = { getItem: () => "{não é json" }
    expect(loadCart(corrupted)).toBeNull()
    expect(loadCart({ getItem: () => JSON.stringify({ restaurantId: 1 }) })).toBeNull()
    const blocked = {
      getItem: () => {
        throw new Error("SecurityError")
      },
      setItem: () => {
        throw new Error("QuotaExceeded")
      },
      removeItem: () => {
        throw new Error("SecurityError")
      },
    }
    expect(loadCart(blocked)).toBeNull()
    expect(() => saveCart(blocked, addLine(null, burger, line()))).not.toThrow()
  })
})
