import { LegalStatus, envelope } from "@delivery/contracts"
import { cookies } from "next/headers"

/** Nomes de cookie de sessão do Better Auth (com ou sem o prefixo `__Secure-` em HTTPS). */
export const hasSessionCookie = (names: readonly string[]): boolean =>
  names.some((name) => name === "better-auth.session_token" || name === "__Secure-better-auth.session_token")

/** Resposta do backend para um objeto `LegalStatus`; qualquer coisa fora do contrato vale como "não sei". */
export function parseLegalStatus(body: unknown): LegalStatus | null {
  const parsed = envelope(LegalStatus).safeParse(body)
  return parsed.success ? parsed.data.data : null
}

/**
 * O usuário logado aceitou a versão vigente dos Termos e da Política? Só consulta quando há cookie de sessão. Se o
 * backend não responder, devolve `true`: uma falha de rede não pode travar o site com um aviso que não dá para resolver.
 */
export async function isLegalAcceptanceCurrent(): Promise<boolean> {
  const baseUrl = process.env.API_URL
  if (!baseUrl) return true
  const store = await cookies()
  if (!hasSessionCookie(store.getAll().map((cookie) => cookie.name))) return true

  try {
    const response = await fetch(new URL("/v1/legal/acceptances", baseUrl), {
      headers: { cookie: store.toString(), accept: "application/json", "x-request-id": crypto.randomUUID() },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) return true
    return parseLegalStatus(await response.json())?.upToDate ?? true
  } catch {
    return true
  }
}
