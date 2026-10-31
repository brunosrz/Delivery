/**
 * Limpa texto digitado por pessoas antes de gravar ou exportar (materiais de marketing): remove marcação HTML e
 * caracteres de controle, mantendo quebras de linha. Não tenta "consertar" HTML: tudo entre < e > é descartado,
 * então um material nunca carrega script ou atributo ativo para quem o abrir depois.
 */

/** Controle (exceto tabulação e quebra de linha), DEL, BOM e separadores de linha e de parágrafo Unicode. */
function isInvisible(code: number): boolean {
  return (
    code <= 8 || (code >= 11 && code <= 31) || code === 127 || code === 0xfeff || code === 0x2028 || code === 0x2029
  )
}

export function sanitizeText(input: string): string {
  // Quebras de linha primeiro: o CR (13) também é "controle" e sumiria antes de virar LF.
  const withoutMarkup = input
    .replace(/\r\n?/g, "\n")
    // Comentários e blocos que carregam conteúdo ativo saem inteiros, com o que está dentro.
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<[^>]*>/g, "")
  return Array.from(withoutMarkup)
    .filter((char) => !isInvisible(char.codePointAt(0) ?? 0))
    .join("")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
