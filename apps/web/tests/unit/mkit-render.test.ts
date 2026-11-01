import { describe, expect, it } from "vitest"
import { escapeHtml, printableHtml, wrapText } from "@/lib/mkit-render"

// Medida simples: cada caractere ocupa 1 unidade.
const measure = (text: string) => text.length

describe("wrapText", () => {
  it("quebra por palavras sem passar da largura", () => {
    expect(wrapText("uma frase bem comprida para quebrar", 12, measure)).toEqual([
      "uma frase",
      "bem comprida",
      "para quebrar",
    ])
  })

  it("preserva quebras de linha e linhas em branco", () => {
    expect(wrapText("linha 1\n\nlinha 2", 40, measure)).toEqual(["linha 1", "", "linha 2"])
  })

  it("corta palavra maior que a linha em vez de estourar", () => {
    const lines = wrapText("superlongapalavrasemespaco fim", 8, measure)
    expect(lines.every((line) => line.length <= 8)).toBe(true)
    expect(lines.join("").replace(/ /g, "")).toBe("superlongapalavrasemespacofim")
  })

  it("texto só com espaços não gera conteúdo", () => {
    expect(wrapText("   ", 10, measure)).toEqual([""])
  })
})

describe("printableHtml", () => {
  it("escapa marcação e converte quebras de linha", () => {
    const html = printableHtml({ title: "<b>Oi</b>", body: 'a & "b"\n<script>x</script>', kind: "cartaz" })
    expect(html).not.toContain("<script>")
    expect(html).not.toContain("<b>Oi</b>")
    expect(html).toContain("&lt;b&gt;Oi&lt;/b&gt;")
    expect(html).toContain("a &amp; &quot;b&quot;<br>&lt;script&gt;")
    expect(html).toContain("<small>Cartaz</small>")
  })

  it("escapeHtml cobre os cinco caracteres especiais", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;")
  })
})
