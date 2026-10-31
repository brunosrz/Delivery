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

const MARKUP_PATTERNS: readonly RegExp[] = [
  // Comentários e blocos que carregam conteúdo ativo saem inteiros, com o que está dentro.
  /<!--[\s\S]*?-->/g,
  /<(script|style)\b[\s\S]*?<\/\1\s*>/gi,
  /<[^>]*>/g,
]

/**
 * Remove a marcação repetidamente até o texto parar de mudar: uma única passada deixaria "<scr<script>ipt>" virar
 * "<script>" depois de remover o miolo. Por fim, qualquer "<" ou ">" que sobrar é descartado: o texto dos materiais
 * nunca precisa de colchetes angulares.
 */
function stripMarkup(input: string): string {
  let current = input
  for (;;) {
    let next = current
    for (const pattern of MARKUP_PATTERNS) next = next.replace(pattern, "")
    if (next === current) break
    current = next
  }
  return current.replace(/[<>]/g, "")
}

export function sanitizeText(input: string): string {
  // Quebras de linha primeiro: o CR (13) também é "controle" e sumiria antes de virar LF.
  const withoutMarkup = stripMarkup(input.replace(/\r\n?/g, "\n"))
  return Array.from(withoutMarkup)
    .filter((char) => !isInvisible(char.codePointAt(0) ?? 0))
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
