import { describe, expect, it } from "vitest"
import { sanitizeText } from "../src/index.js"

describe("sanitizeText", () => {
  it("remove marcação HTML e blocos ativos inteiros", () => {
    expect(sanitizeText("Oferta <b>imperdível</b>!")).toBe("Oferta imperdível!")
    expect(sanitizeText('Oi<script>alert("x")</script>Mundo')).toBe("OiMundo")
    expect(sanitizeText("A<style>body{display:none}</style>B")).toBe("AB")
    expect(sanitizeText('<img src=x onerror="alert(1)">Texto')).toBe("Texto")
    expect(sanitizeText("a<!-- segredo -->b")).toBe("ab")
  })

  it("remove caracteres de controle e separadores Unicode, mantendo as quebras de linha", () => {
    const dirty = [
      "a",
      String.fromCharCode(0),
      "b",
      String.fromCharCode(7),
      "c",
      String.fromCharCode(0x2028),
      "d",
    ].join("")
    expect(sanitizeText(dirty)).toBe("abcd")
    expect(sanitizeText("linha 1\r\nlinha 2\rlinha 3")).toBe("linha 1\nlinha 2\nlinha 3")
  })

  it("colapsa linhas em branco demais e apara as pontas", () => {
    expect(sanitizeText("  a\n\n\n\n\nb  ")).toBe("a\n\nb")
  })

  it("preserva acentos, emoji e símbolos comuns", () => {
    expect(sanitizeText("Promoção: 2 por 1 🍔 (só hoje) — R$ 29,90")).toBe("Promoção: 2 por 1 🍔 (só hoje) — R$ 29,90")
  })

  it("não deixa tag escapar por quebra de linha dentro dela", () => {
    expect(sanitizeText("<scr\nipt>x</scr\nipt>y")).toBe("xy")
  })
})

describe("sanitizeText contra marcação aninhada", () => {
  it.each([
    "<scr<script>ipt>alert(1)</scr</script>ipt>",
    "<<b>script>alert(1)<</b>/script>",
    "<!<!-- x -->-- y -->texto",
    "<<script>script>alert(1)</script>",
    "a<scr<!-- x -->ipt>b",
  ])("não deixa sobrar colchetes angulares em %s", (input) => {
    const output = sanitizeText(input)
    expect(output).not.toMatch(/[<>]/)
    expect(output.toLowerCase()).not.toContain("<script")
  })

  it("mantém o texto legítimo ao redor", () => {
    expect(sanitizeText("Oferta <<b>b>boa</b>!")).not.toMatch(/[<>]/)
    expect(sanitizeText("2 por 1")).toBe("2 por 1")
  })
})
