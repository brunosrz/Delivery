// Exportação de materiais do MKit como imagem (PNG) e PDF, feita no navegador: sem dependência nova e sem enviar o
// texto a terceiros. O texto já chega sanitizado do servidor; mesmo assim, tudo que vira HTML passa por escapeHtml.

export type MaterialForRender = { title: string; body: string; kind: "post" | "cartaz" | "promocao" }

export const KIND_LABEL = { post: "Post", cartaz: "Cartaz", promocao: "Promoção" } as const

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }
export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char)

/** Quebra o texto em linhas que cabem em `maxWidth`, respeitando as quebras de linha e palavras longas demais. */
export function wrapText(text: string, maxWidth: number, measure: (text: string) => number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split("\n")) {
    if (paragraph.trim() === "") {
      lines.push("")
      continue
    }
    let current = ""
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word
      if (measure(candidate) <= maxWidth) {
        current = candidate
        continue
      }
      if (current) lines.push(current)
      current = ""
      // Palavra maior que a linha: corta por caracteres.
      let rest = word
      while (measure(rest) > maxWidth && rest.length > 1) {
        let cut = rest.length - 1
        while (cut > 1 && measure(rest.slice(0, cut)) > maxWidth) cut -= 1
        lines.push(rest.slice(0, cut))
        rest = rest.slice(cut)
      }
      current = rest
    }
    if (current) lines.push(current)
  }
  return lines
}

/** Página imprimível (o navegador salva como PDF pelo diálogo de impressão). */
export function printableHtml(material: MaterialForRender): string {
  const body = escapeHtml(material.body).replace(/\n/g, "<br>")
  return [
    "<!doctype html><html lang=pt-BR><head><meta charset=utf-8>",
    `<title>${escapeHtml(material.title)}</title>`,
    "<style>body{font-family:system-ui,sans-serif;max-width:680px;margin:32px auto;padding:0 16px;color:#1f2937}",
    "small{color:#6b7280;text-transform:uppercase;letter-spacing:.08em}h1{margin:.2em 0 .6em}p{font-size:18px;line-height:1.5}</style>",
    "</head><body>",
    `<small>${KIND_LABEL[material.kind]}</small><h1>${escapeHtml(material.title)}</h1><p>${body}</p>`,
    "</body></html>",
  ].join("")
}

const WIDTH = 1080

/** Desenha o material numa imagem de 1080 px de largura (formato de post) e devolve o PNG. */
export function renderMaterialPng(material: MaterialForRender): Promise<Blob> {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) return Promise.reject(new Error("canvas indisponível"))

  const margin = 80
  const font = (size: number, weight = 400) => `${weight} ${size}px system-ui, sans-serif`
  context.font = font(44)
  const bodyLines = wrapText(material.body, WIDTH - margin * 2, (text) => context.measureText(text).width)
  context.font = font(64, 700)
  const titleLines = wrapText(material.title, WIDTH - margin * 2, (text) => context.measureText(text).width)

  const bodyLine = 64
  const titleLine = 80
  const height = Math.max(WIDTH, margin * 2 + 60 + titleLines.length * titleLine + 40 + bodyLines.length * bodyLine)
  canvas.width = WIDTH
  canvas.height = height

  context.fillStyle = "#fffaf0"
  context.fillRect(0, 0, WIDTH, height)
  context.fillStyle = "#ea580c"
  context.fillRect(0, 0, WIDTH, 24)

  let y = margin + 24
  context.font = font(32, 700)
  context.fillText(KIND_LABEL[material.kind].toUpperCase(), margin, y)

  y += 40
  context.fillStyle = "#1f2937"
  context.font = font(64, 700)
  for (const line of titleLines) {
    y += titleLine
    context.fillText(line, margin, y)
  }

  y += 24
  context.font = font(44)
  for (const line of bodyLines) {
    y += bodyLine
    context.fillText(line, margin, y)
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("falha ao gerar a imagem"))), "image/png"),
  )
}

/** Abre a aba da impressão. Precisa rodar direto no clique: depois de um `await` o navegador bloqueia o pop-up. */
export const openPrintWindow = () => window.open("", "_blank")

/** Escreve o material na aba aberta e aciona a impressão (escolher "Salvar como PDF"). */
export function printInto(popup: Window, material: MaterialForRender) {
  popup.document.open()
  popup.document.write(printableHtml(material))
  popup.document.close()
  popup.focus()
  popup.print()
}
