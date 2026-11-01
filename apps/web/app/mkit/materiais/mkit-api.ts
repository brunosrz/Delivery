// Tipos e chamadas do painel do MKit pelo proxy do próprio site (cookie de sessão first-party).

export type Kind = "post" | "cartaz" | "promocao"
export type Medium = "digital" | "fisico"

export type Material = {
  id: string
  title: string
  kind: Kind
  medium: Medium
  categoryId: string | null
  body: string
  status: "draft" | "published"
  exportCount: number
  deletedAt: string | null
}

export type Category = { id: string; name: string; scope: "platform" | "restaurant" }

export type Metrics = {
  total: number
  published: number
  drafts: number
  trashed: number
  totalExports: number
  byKind: { post: number; cartaz: number; promocao: number }
  top: { id: string; title: string; exportCount: number }[]
}

export type CallResult<T> = { ok: true; data: T } | { ok: false; message: string }

export const mkitBase = (restaurantId: string) => `/api/v1/manage/restaurants/${encodeURIComponent(restaurantId)}/mkit`

/** Chamada JSON ao backend. Devolve a mensagem de erro do envelope quando há, ou um texto genérico. */
export async function callApi<T>(
  url: string,
  init: RequestInit = {},
  doFetch: typeof fetch = fetch,
): Promise<CallResult<T>> {
  try {
    const response = await doFetch(url, {
      ...init,
      headers: { ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers },
    })
    const body = (await response.json().catch(() => null)) as { data?: T; error?: { message?: string } | null } | null
    if (!response.ok || !body || body.data === undefined || body.data === null) {
      return { ok: false, message: body?.error?.message ?? "Não foi possível concluir." }
    }
    return { ok: true, data: body.data }
  } catch {
    return { ok: false, message: "Sem conexão com o servidor." }
  }
}

export const KIND_LABEL: Record<Kind, string> = { post: "Post", cartaz: "Cartaz", promocao: "Promoção" }
export const MEDIUM_LABEL: Record<Medium, string> = { digital: "Digital", fisico: "Físico" }
