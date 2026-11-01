import { describe, expect, it } from "vitest"
import { SHARE_TEXT_LIMIT, captionText, shareText, whatsappUrl } from "@/lib/mkit-share"

const material = { title: "Promoção da semana", body: "Burger por R$ 26,32.\nPeça agora." }

describe("compartilhamento do MKit", () => {
  it("monta o texto com título em destaque e corpo", () => {
    expect(shareText(material)).toBe("*Promoção da semana*\n\nBurger por R$ 26,32.\nPeça agora.")
    expect(captionText(material)).toBe("Promoção da semana\n\nBurger por R$ 26,32.\nPeça agora.")
  })

  it("o link do WhatsApp codifica tudo: nada do texto vira parte do endereço", () => {
    const url = whatsappUrl({ title: "A&B=C", body: "x#y?z=1&w=2 <script>" })
    expect(url.startsWith("https://wa.me/?text=")).toBe(true)
    const query = url.slice("https://wa.me/?text=".length)
    expect(query).not.toMatch(/[&#?=<> ]/)
    expect(decodeURIComponent(query)).toBe("*A&B=C*\n\nx#y?z=1&w=2 <script>")
  })

  it("corta textos longos no limite, com reticências, sem estourar", () => {
    const long = { title: "T", body: "palavra ".repeat(1000) }
    const text = shareText(long)
    expect(text.length).toBeLessThanOrEqual(SHARE_TEXT_LIMIT)
    expect(text.endsWith("…")).toBe(true)
    expect(shareText({ title: "T", body: "curto" })).toBe("*T*\n\ncurto")
  })
})
