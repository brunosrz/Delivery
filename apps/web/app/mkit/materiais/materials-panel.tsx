"use client"

import { useCallback, useEffect, useState } from "react"

type Material = {
  id: string
  title: string
  kind: "post" | "cartaz" | "promocao"
  body: string
  status: "draft" | "published"
  exportCount: number
}

const KIND_LABEL = { post: "Post", cartaz: "Cartaz", promocao: "Promoção" } as const
const field = "mt-1 w-full rounded-md border px-3 py-2"

export function MaterialsPanel({ restaurantId }: { restaurantId: string }) {
  const base = `/api/v1/manage/restaurants/${encodeURIComponent(restaurantId)}/mkit/materials`
  const [materials, setMaterials] = useState<Material[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const response = await fetch(base)
      const body = (await response.json()) as { data: Material[] | null; error: { message: string } | null }
      if (response.ok && body.data) setMaterials(body.data)
      else setMessage(body.error?.message ?? "Não foi possível carregar os materiais.")
    } catch {
      setMessage("Sem conexão com o servidor.")
    }
  }, [base])

  useEffect(() => {
    void load()
  }, [load])

  async function call(url: string, init: RequestInit) {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch(url, init)
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
        setMessage(body?.error?.message ?? "Não foi possível concluir.")
        return false
      }
      return true
    } catch {
      setMessage("Sem conexão com o servidor.")
      return false
    } finally {
      setBusy(false)
    }
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const ok = await call(base, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: String(data.get("title") ?? ""),
        kind: String(data.get("kind") ?? "post"),
        body: String(data.get("body") ?? ""),
      }),
    })
    if (ok) {
      form.reset()
      await load()
    }
  }

  async function toggle(material: Material) {
    const status = material.status === "draft" ? "published" : "draft"
    if (
      await call(`${base}/${material.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      })
    ) {
      await load()
    }
  }

  async function remove(material: Material) {
    if (!window.confirm(`Remover "${material.title}"?`)) return
    if (await call(`${base}/${material.id}`, { method: "DELETE" })) await load()
  }

  /** Baixa o texto pelo próprio site (cookie de sessão) e conta a exportação no servidor. */
  async function download(material: Material) {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch(`${base}/${material.id}/export`)
      if (!response.ok) {
        setMessage("Não foi possível exportar.")
        return
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download =
        /filename="([^"]+)"/.exec(response.headers.get("content-disposition") ?? "")?.[1] ?? "material.txt"
      link.click()
      URL.revokeObjectURL(url)
      await load()
    } catch {
      setMessage("Sem conexão com o servidor.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Materiais do MKit</h1>

      <form onSubmit={create} className="mb-8 space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Novo material</h2>
        <label className="block">
          Título
          <input name="title" required minLength={2} maxLength={120} className={field} />
        </label>
        <label className="block">
          Tipo
          <select name="kind" className={field} defaultValue="post">
            <option value="post">Post</option>
            <option value="cartaz">Cartaz</option>
            <option value="promocao">Promoção</option>
          </select>
        </label>
        <label className="block">
          Texto
          <textarea name="body" required maxLength={5000} rows={5} className={field} />
        </label>
        <p className="text-sm text-gray-600">Marcação HTML é removida automaticamente do texto.</p>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          Criar material
        </button>
      </form>

      {message && (
        <p role="alert" className="mb-4 text-red-700">
          {message}
        </p>
      )}

      <section aria-labelledby="lista">
        <h2 id="lista" className="mb-3 text-xl font-semibold">
          Seus materiais {materials ? `(${materials.length})` : ""}
        </h2>
        {materials === null && !message && <p>Carregando…</p>}
        {materials?.length === 0 && <p className="text-gray-600">Nenhum material ainda.</p>}
        <ul className="space-y-3">
          {materials?.map((material) => (
            <li key={material.id} className="rounded-lg border p-4">
              <p className="font-medium">
                {material.title} <span className="text-sm text-gray-600">· {KIND_LABEL[material.kind]}</span>
              </p>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{material.body}</p>
              <p className="mt-1 text-xs text-gray-600">
                {material.status === "published" ? "Publicado" : "Rascunho"} · {material.exportCount} exportações
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggle(material)}
                  className="rounded-md border px-3 py-1 text-sm"
                >
                  {material.status === "draft" ? "Publicar" : "Voltar a rascunho"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => download(material)}
                  className="rounded-md border px-3 py-1 text-sm"
                >
                  Exportar (.txt)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(material)}
                  className="rounded-md border px-3 py-1 text-sm text-red-700"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
