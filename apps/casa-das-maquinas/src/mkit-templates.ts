import type { MkitMaterial } from "@delivery/contracts"

/** Dados do restaurante e do produto que alimentam os modelos. Tudo que for opcional pode vir vazio. */
export type TemplateInput = {
  restaurantName: string
  product?: { name: string; description: string | null; priceCents: number; originalPriceCents: number | null }
  eventName?: string
  discountPercent?: number
}

export type RenderedTemplate = { title: string; body: string; kind: MkitMaterial["kind"] }

/** 3290 -> "R$ 32,90" (centavos inteiros; nunca ponto flutuante). */
export function formatBrl(cents: number): string {
  const reais = Math.floor(cents / 100)
  const rest = String(cents % 100).padStart(2, "0")
  return `R$ ${String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${rest}`
}

/** Preço com desconto, arredondado para o centavo mais próximo. */
export const discounted = (cents: number, percent: number) => Math.round((cents * (100 - percent)) / 100)

/**
 * Rascunhos a partir de modelos fixos. Texto determinístico (sem IA): o mesmo dado gera o mesmo rascunho, o que torna
 * o resultado testável. Dado ausente (produto sem descrição, sem preço original) só encurta o texto.
 */
export function renderTemplate(template: "promocao" | "novidade" | "data", input: TemplateInput): RenderedTemplate {
  const { restaurantName, product } = input

  if (template === "promocao") {
    if (!product) throw new Error("promocao exige produto")
    const percent = input.discountPercent
    const price = percent ? discounted(product.priceCents, percent) : product.priceCents
    const lines = percent
      ? [
          `${product.name} com ${percent}% de desconto no ${restaurantName}!`,
          `De ${formatBrl(product.priceCents)} por apenas ${formatBrl(price)}.`,
        ]
      : [
          `Hoje tem ${product.name} no ${restaurantName}!`,
          product.originalPriceCents && product.originalPriceCents > product.priceCents
            ? `De ${formatBrl(product.originalPriceCents)} por apenas ${formatBrl(product.priceCents)}.`
            : `Por apenas ${formatBrl(product.priceCents)}.`,
        ]
    lines.push("Peça agora pelo Delivery Express.")
    return { title: `Promoção: ${product.name}`, body: lines.join("\n"), kind: "promocao" }
  }

  if (template === "novidade") {
    if (!product) throw new Error("novidade exige produto")
    const lines = [`Novidade no ${restaurantName}: ${product.name}!`]
    if (product.description) lines.push(product.description)
    lines.push(`A partir de ${formatBrl(product.priceCents)}. Peça agora pelo Delivery Express.`)
    return { title: `Novidade: ${product.name}`, body: lines.join("\n"), kind: "post" }
  }

  const event = input.eventName ?? ""
  return {
    title: `${event} no ${restaurantName}`,
    body: `${event} chegou! O ${restaurantName} preparou algo especial para comemorar com você.\nPeça pelo Delivery Express.`,
    kind: "post",
  }
}
