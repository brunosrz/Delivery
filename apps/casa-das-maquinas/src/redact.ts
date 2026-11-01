// Máscara de credenciais em texto que vai para logs. É a última barreira: o código já evita logar corpo,
// headers e cookies, mas uma mensagem de erro de biblioteca pode trazer um token no meio do texto.

const MASK = "***"

const PATTERNS: readonly [RegExp, string][] = [
  // Authorization: Bearer abc / Basic abc / só "Bearer abc"
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{6,}/gi, `$1 ${MASK}`],
  [/\b(authorization\s*[:=]\s*)[^\s,;"']+(?:\s+[^\s,;"']+)?/gi, `$1${MASK}`],
  // Cookie e Set-Cookie inteiros, até o fim da linha ou do trecho entre aspas
  [/\b((?:set-)?cookie\s*[:=]\s*)[^\n"]+/gi, `$1${MASK}`],
  // Token de sessão do Better Auth e ticket de tempo real
  [/\b([\w.-]*session_(?:token|data)=)[^;\s"']+/gi, `$1${MASK}`],
  // Chave Asaas ($aact_hmlg_... / $aact_prod_...) e token de webhook
  [/\$aact_(?:hmlg|prod)_[A-Za-z0-9._-]+/g, MASK],
  [/\b(asaas-access-token\s*[:=]\s*)[^\s,;"']+/gi, `$1${MASK}`],
  // Pares chave=valor ou chave: valor com nome sensível (token, secret, password, api key, ticket)
  [
    /\b((?:[\w-]*(?:token|secret|password|passwd|api[_-]?key|ticket)[\w-]*)["']?\s*[=:]\s*)("[^"]*"|'[^']*'|[^\s,;&"']+)/gi,
    `$1${MASK}`,
  ],
]

/** Substitui credenciais conhecidas por `***`. Não lança e devolve o mesmo texto se não houver nada a mascarar. */
export function redact(text: string): string {
  let result = text
  for (const [pattern, replacement] of PATTERNS) result = result.replace(pattern, replacement)
  return result
}

/** Caminho sem query string (a query pode carregar ticket ou token). */
export function pathWithoutQuery(url: string): string {
  const end = url.search(/[?#]/)
  return end === -1 ? url : url.slice(0, end)
}
