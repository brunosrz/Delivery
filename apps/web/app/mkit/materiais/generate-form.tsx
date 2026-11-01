"use client"

import { useState } from "react"
import { type Category, type Material, callApi, mkitBase } from "./mkit-api"

const field = "mt-1 w-full rounded-md border px-3 py-2"

type Template = "promocao" | "novidade" | "data"

/** Gera um rascunho a partir de modelos fixos e dos dados do restaurante (sem IA). O rascunho cai na lista. */
export function GenerateForm({
  restaurantId,
  products,
  categories,
  onCreated,
}: {
  restaurantId: string
  products: { id: string; name: string }[]
  categories: Category[]
  onCreated: () => void
}) {
  const [template, setTemplate] = useState<Template>("promocao")
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const discount = Number(data.get("discountPercent"))
    const categoryId = String(data.get("categoryId") ?? "")
    setBusy(true)
    setMessage(null)
    const result = await callApi<Material>(`${mkitBase(restaurantId)}/materials/generate`, {
      method: "POST",
      body: JSON.stringify({
        template,
        medium: String(data.get("medium") ?? "digital"),
        ...(categoryId ? { categoryId } : {}),
        ...(template !== "data" ? { productId: String(data.get("productId") ?? "") } : {}),
        ...(template === "promocao" && discount > 0 ? { discountPercent: discount } : {}),
        ...(template === "data" ? { eventName: String(data.get("eventName") ?? "") } : {}),
      }),
    })
    setBusy(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    onCreated()
  }

  return (
    <form onSubmit={submit} className="mb-8 space-y-3 rounded-lg border p-4">
      <h2 className="font-semibold">Gerar rascunho</h2>
      <label className="block">
        Modelo
        <select value={template} onChange={(event) => setTemplate(event.target.value as Template)} className={field}>
          <option value="promocao">Promoção de um produto</option>
          <option value="novidade">Novidade (produto)</option>
          <option value="data">Data comemorativa</option>
        </select>
      </label>
      {template !== "data" && (
        <label className="block">
          Produto
          <select name="productId" required className={field}>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {template === "promocao" && (
        <label className="block">
          Desconto (%, opcional)
          <input name="discountPercent" type="number" min={1} max={90} className={field} />
        </label>
      )}
      {template === "data" && (
        <label className="block">
          Nome da data
          <input name="eventName" required minLength={2} maxLength={80} className={field} />
        </label>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          Meio
          <select name="medium" defaultValue="digital" className={field}>
            <option value="digital">Digital</option>
            <option value="fisico">Físico</option>
          </select>
        </label>
        <label className="block">
          Categoria
          <select name="categoryId" defaultValue="" className={field}>
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="submit"
        disabled={busy || (template !== "data" && products.length === 0)}
        className="rounded-md border px-4 py-2 font-semibold disabled:opacity-60"
      >
        Gerar rascunho
      </button>
      {template !== "data" && products.length === 0 && (
        <p className="text-sm text-gray-600">Nenhum produto disponível no cardápio para gerar este modelo.</p>
      )}
      {message && (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      )}
    </form>
  )
}
