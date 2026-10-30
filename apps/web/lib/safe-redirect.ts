/**
 * Aceita só caminhos internos como destino pós-login. Bloqueia URLs absolutas,
 * "//host" (protocol-relative) e "/\host", que levariam o usuário para fora do site.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback
  return value
}
