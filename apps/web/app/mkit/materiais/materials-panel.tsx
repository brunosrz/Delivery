"use client"

import { useCallback, useEffect, useState } from "react"
import { captionText, whatsappUrl } from "@/lib/mkit-share"
import { openPrintWindow, printInto, renderMaterialPng } from "@/lib/mkit-render"
import { CalendarSection } from "./calendar-section"
import { GenerateForm } from "./generate-form"
import { type Category, KIND_LABEL, MEDIUM_LABEL, type Material, type Metrics, callApi, mkitBase } from "./mkit-api"

const field = "mt-1 w-full rounded-md border px-3 py-2"
const smallButton = "rounded-md border px-3 py-1 text-sm disabled:opacity-60"

export function MaterialsPanel({
  restaurantId,
  products,
}: {
  restaurantId: string
  products: { id: string; name: string }[]
}) {
  const root = mkitBase(restaurantId)
  const base = `${root}/materials`
  const [view, setView] = useState<"active" | "trash">("active")
  const [materials, setMaterials] = useState<Material[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState("")

  const load = useCallback(async () => {
    // Números e categorias são secundários: se falharem, a lista continua funcionando.
    void callApi<Metrics>(`${root}/metrics`).then((result) => result.ok && setMetrics(result.data))
    void callApi<Category[]>(`${root}/categories`).then((result) => result.ok && setCategories(result.data))
    const result = await callApi<Material[]>(`${base}${view === "trash" ? "?lixeira=1" : ""}`)
    if (result.ok) setMaterials(result.data)
    else setMessage(result.message)
  }, [root, base, view])

  useEffect(() => {
    void load()
  }, [load])

  /** Executa uma ação, mostra o erro do servidor se houver e recarrega. */
  async function act(url: string, init: RequestInit, success?: string) {
    setBusy(true)
    setMessage(null)
    setNotice(null)
    const result = await callApi<unknown>(url, init)
    setBusy(false)
    if (!result.ok) {
      setMessage(result.message)
      return false
    }
    if (success) setNotice(success)
    await load()
    return true
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const categoryId = String(data.get("categoryId") ?? "")
    const ok = await act(base, {
      method: "POST",
      body: JSON.stringify({
        title: String(data.get("title") ?? ""),
        kind: String(data.get("kind") ?? "post"),
        medium: String(data.get("medium") ?? "digital"),
        ...(categoryId ? { categoryId } : {}),
        body: String(data.get("body") ?? ""),
      }),
    })
    if (ok) form.reset()
  }

  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const name = String(new FormData(form).get("name") ?? "")
    if (await act(`${root}/categories`, { method: "POST", body: JSON.stringify({ name }) })) form.reset()
  }

  const toggle = (material: Material) =>
    act(`${base}/${material.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: material.status === "draft" ? "published" : "draft" }),
    })

  const trash = (material: Material) =>
    act(
      `${base}/${material.id}`,
      { method: "DELETE" },
      `"${material.title}" foi para a lixeira. Dá para restaurar por 30 dias.`,
    )

  const restore = (material: Material) =>
    act(`${base}/${material.id}/restore`, { method: "POST" }, `"${material.title}" foi restaurado.`)

  async function purge(material: Material) {
    if (!window.confirm(`Excluir "${material.title}" em definitivo? Isso não pode ser desfeito.`)) return
    await act(`${base}/${material.id}?definitivo=1`, { method: "DELETE" })
  }

  /** Conta a exportação no servidor (mesma métrica do .txt) e só então gera o arquivo no navegador. */
  async function exportAs(material: Material, format: "txt" | "png" | "pdf") {
    // A aba de impressão abre já no clique; depois do fetch o navegador a trataria como pop-up indesejado.
    const popup = format === "pdf" ? openPrintWindow() : null
    if (format === "pdf" && !popup) {
      setMessage("O navegador bloqueou a janela de impressão. Libere pop-ups e tente de novo.")
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const counted = await fetch(`${base}/${material.id}/export`)
      if (!counted.ok) {
        popup?.close()
        setMessage("Não foi possível exportar.")
        return
      }
      if (format === "txt") {
        const filename =
          /filename="([^"]+)"/.exec(counted.headers.get("content-disposition") ?? "")?.[1] ?? "material.txt"
        download(await counted.blob(), filename)
      } else if (popup) {
        printInto(popup, material)
      } else {
        download(
          await renderMaterialPng(material),
          `${material.title.replace(/[^\w-]+/g, "-").slice(0, 60) || "material"}.png`,
        )
      }
      await load()
    } catch {
      setMessage("Não foi possível gerar o arquivo.")
    } finally {
      setBusy(false)
    }
  }

  async function copyCaption(material: Material) {
    try {
      await navigator.clipboard.writeText(captionText(material))
      setNotice("Legenda copiada. Cole no Instagram, Facebook ou onde preferir.")
    } catch {
      setMessage("O navegador não deixou copiar. Selecione o texto e copie manualmente.")
    }
  }

  const categoryName = (id: string | null) => categories.find((category) => category.id === id)?.name
  const visible = (materials ?? []).filter((material) => !filter || material.categoryId === filter)

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Materiais do MKit</h1>

      {metrics && (
        <section aria-labelledby="metricas" className="mb-8 rounded-lg border p-4">
          <h2 id="metricas" className="mb-3 font-semibold">
            Uso do MKit
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(
              [
                ["Materiais", metrics.total],
                ["Publicados", metrics.published],
                ["Rascunhos", metrics.drafts],
                ["Exportações", metrics.totalExports],
                ["Na lixeira", metrics.trashed],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-600">{label}</dt>
                <dd className="text-2xl font-bold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-gray-600">
            Posts {metrics.byKind.post} · Cartazes {metrics.byKind.cartaz} · Promoções {metrics.byKind.promocao}
          </p>
          {metrics.top.length > 0 && (
            <ol className="mt-3 list-decimal pl-5 text-sm">
              {metrics.top.map((item) => (
                <li key={item.id}>
                  {item.title} · {item.exportCount} exportações
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <GenerateForm restaurantId={restaurantId} products={products} categories={categories} onCreated={load} />

      <form onSubmit={create} className="mb-8 space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Novo material</h2>
        <label className="block">
          Título
          <input name="title" required minLength={2} maxLength={120} className={field} />
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            Tipo
            <select name="kind" className={field} defaultValue="post">
              <option value="post">Post</option>
              <option value="cartaz">Cartaz</option>
              <option value="promocao">Promoção</option>
            </select>
          </label>
          <label className="block">
            Meio
            <select name="medium" className={field} defaultValue="digital">
              <option value="digital">Digital</option>
              <option value="fisico">Físico</option>
            </select>
          </label>
          <label className="block">
            Categoria
            <select name="categoryId" className={field} defaultValue="">
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
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

      <section aria-labelledby="categorias" className="mb-8 rounded-lg border p-4">
        <h2 id="categorias" className="mb-3 font-semibold">
          Categorias
        </h2>
        <ul className="mb-3 flex flex-wrap gap-2 text-sm">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-1 rounded-full border px-3 py-1">
              {category.name}
              {category.scope === "restaurant" && (
                <button
                  type="button"
                  aria-label={`Remover categoria ${category.name}`}
                  onClick={() => act(`${root}/categories/${category.id}`, { method: "DELETE" })}
                  className="text-red-700"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={addCategory} className="flex gap-2">
          <input
            name="name"
            required
            minLength={2}
            maxLength={60}
            placeholder="Nova categoria"
            className="flex-1 rounded-md border px-3 py-2"
          />
          <button type="submit" className={smallButton}>
            Adicionar
          </button>
        </form>
      </section>

      <CalendarSection restaurantId={restaurantId} />

      {message && (
        <p role="alert" className="mb-4 text-red-700">
          {message}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 text-green-800">
          {notice}
        </p>
      )}

      <section aria-labelledby="lista">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="lista" className="text-xl font-semibold">
            {view === "trash" ? "Lixeira" : "Seus materiais"} {materials ? `(${visible.length})` : ""}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {view === "active" && (
              <label className="text-sm">
                <span className="sr-only">Filtrar por categoria</span>
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="rounded-md border px-2 py-1"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="button"
              className={smallButton}
              onClick={() => {
                setMaterials(null)
                setView(view === "active" ? "trash" : "active")
              }}
            >
              {view === "active" ? "Ver lixeira" : "Voltar aos materiais"}
            </button>
          </div>
        </div>
        {materials === null && !message && <p>Carregando…</p>}
        {materials?.length === 0 && (
          <p className="text-gray-600">{view === "trash" ? "A lixeira está vazia." : "Nenhum material ainda."}</p>
        )}
        <ul className="space-y-3">
          {visible.map((material) => (
            <li key={material.id} className="rounded-lg border p-4">
              <p className="font-medium">
                {material.title}{" "}
                <span className="text-sm text-gray-600">
                  · {KIND_LABEL[material.kind]} · {MEDIUM_LABEL[material.medium]}
                  {categoryName(material.categoryId) ? ` · ${categoryName(material.categoryId)}` : ""}
                </span>
              </p>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{material.body}</p>
              <p className="mt-1 text-xs text-gray-600">
                {material.status === "published" ? "Publicado" : "Rascunho"} · {material.exportCount} exportações
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {view === "trash" ? (
                  <>
                    <button type="button" disabled={busy} onClick={() => restore(material)} className={smallButton}>
                      Restaurar
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => purge(material)}
                      className={`${smallButton} text-red-700`}
                    >
                      Excluir em definitivo
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" disabled={busy} onClick={() => toggle(material)} className={smallButton}>
                      {material.status === "draft" ? "Publicar" : "Voltar a rascunho"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => exportAs(material, "txt")}
                      className={smallButton}
                    >
                      Exportar (.txt)
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => exportAs(material, "png")}
                      className={smallButton}
                    >
                      Imagem (.png)
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => exportAs(material, "pdf")}
                      className={smallButton}
                    >
                      PDF
                    </button>
                    <a
                      href={whatsappUrl(material)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${smallButton} inline-block`}
                    >
                      WhatsApp
                    </a>
                    <button type="button" onClick={() => copyCaption(material)} className={smallButton}>
                      Copiar legenda
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => trash(material)}
                      className={`${smallButton} text-red-700`}
                    >
                      Mover para a lixeira
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
