import { SessionUser, envelope } from "@delivery/contracts"
import { cookies } from "next/headers"

/**
 * Usuário da sessão para Server Components, validado pela Casa das Máquinas.
 * O cookie só é repassado ao backend; nada da sessão é decidido no front.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const baseUrl = process.env.CASA_DAS_MAQUINAS_URL
  if (!baseUrl) return null
  const cookie = (await cookies()).toString()
  if (!cookie) return null

  try {
    const response = await fetch(new URL("/v1/me", baseUrl), {
      headers: { cookie, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    })
    if (!response.ok) return null
    const parsed = envelope(SessionUser).safeParse(await response.json())
    return parsed.success ? parsed.data.data : null
  } catch {
    return null
  }
}
