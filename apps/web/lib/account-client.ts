import { DELETE_ACCOUNT_CONFIRMATION } from "@delivery/contracts"

// Chamadas de privacidade (LGPD) pelo proxy do próprio site: o cookie de sessão nunca sai do navegador do titular.

export { DELETE_ACCOUNT_CONFIRMATION }

export type AccountCallResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string }

const OFFLINE: AccountCallResult<never> = {
  ok: false,
  status: 0,
  message: "Não foi possível falar com o servidor. Tente de novo.",
}

async function errorOf(response: Response): Promise<AccountCallResult<never>> {
  const body = (await response.json().catch(() => null)) as { error?: { message?: string } | null } | null
  return { ok: false, status: response.status, message: body?.error?.message ?? "Não foi possível concluir." }
}

/** Nome do arquivo baixado: a data entra para o titular guardar mais de uma cópia. */
export const exportFilename = (now = new Date()) => `meus-dados-${now.toISOString().slice(0, 10)}.json`

/** Busca a cópia dos dados e devolve o texto JSON já formatado, pronto para download. */
export async function fetchAccountExport(doFetch: typeof fetch = fetch): Promise<AccountCallResult<string>> {
  let response: Response
  try {
    response = await doFetch("/api/v1/me/export", { headers: { accept: "application/json" } })
  } catch {
    return OFFLINE
  }
  if (!response.ok) return errorOf(response)
  try {
    const body = (await response.json()) as { data: unknown }
    return { ok: true, data: JSON.stringify(body.data, null, 2) }
  } catch {
    return { ok: false, status: response.status, message: "Resposta inválida do servidor." }
  }
}

/** Anonimiza a conta. A frase de confirmação é exigida também no servidor. */
export async function deleteAccount(
  confirm: string,
  doFetch: typeof fetch = fetch,
): Promise<AccountCallResult<{ deleted: true }>> {
  let response: Response
  try {
    response = await doFetch("/api/v1/me", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirm }),
    })
  } catch {
    return OFFLINE
  }
  if (!response.ok) return errorOf(response)
  return { ok: true, data: { deleted: true } }
}
