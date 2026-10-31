"use client"

import Link from "next/link"
import { useState } from "react"
import type { AddonGroup } from "@delivery/contracts"
import { addLine, validateSelection } from "@/lib/cart"
import { useCart } from "@/lib/use-cart"
import { formatCents } from "@/lib/utils"

type Props = {
  restaurant: { id: string; slug: string; name: string }
  product: { id: string; name: string; maxQuantity: number; available: boolean; addonGroups: AddonGroup[] }
}

function selectionRule(group: AddonGroup): string {
  if (group.minSelections === 0)
    return group.maxSelections === 1 ? "Opcional, escolha até 1" : `Opcional, até ${group.maxSelections}`
  if (group.minSelections === group.maxSelections) return `Obrigatório, escolha ${group.minSelections}`
  return `Obrigatório, de ${group.minSelections} a ${group.maxSelections}`
}

export function AddToCart({ restaurant, product }: Props) {
  const [cart, setCart] = useCart()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [added, setAdded] = useState(false)

  function toggle(group: AddonGroup, optionId: string) {
    setAdded(false)
    setSelected((current) => {
      const next = new Set(current)
      if (group.maxSelections === 1) {
        for (const option of group.options) next.delete(option.id)
        next.add(optionId)
      } else if (next.has(optionId)) next.delete(optionId)
      else next.add(optionId)
      return next
    })
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const found = validateSelection(product.addonGroups, selected)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    if (cart && cart.restaurantId !== restaurant.id) {
      const ok = window.confirm(`Sua sacola tem itens de ${cart.restaurantName}. Deseja esvaziá-la e começar uma nova?`)
      if (!ok) return
    }
    const options = product.addonGroups.flatMap((group) => group.options).filter((option) => selected.has(option.id))
    setCart(
      addLine(
        cart,
        restaurant,
        {
          productId: product.id,
          productName: product.name,
          quantity,
          addonOptionIds: options.map((option) => option.id),
          addonLabels: options.map((option) => option.name),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
        product.maxQuantity,
      ),
    )
    setAdded(true)
  }

  return (
    <form onSubmit={submit} noValidate>
      {product.addonGroups.map((group) => {
        const single = group.maxSelections === 1
        return (
          <fieldset key={group.id} className="mb-6 rounded-lg border p-4" aria-describedby={`erro-${group.id}`}>
            <legend className="px-1 font-semibold">{group.name}</legend>
            <p className="mb-3 text-sm text-gray-600">{selectionRule(group)}</p>
            <ul className="space-y-2">
              {group.options.map((option) => (
                <li key={option.id}>
                  <label className="flex items-center justify-between gap-3 rounded-md border p-3">
                    <span className="flex items-center gap-3">
                      <input
                        type={single ? "radio" : "checkbox"}
                        name={`addon-${group.id}`}
                        checked={selected.has(option.id)}
                        disabled={!option.available}
                        onChange={() => toggle(group, option.id)}
                      />
                      {option.name}
                      {!option.available && <span className="text-sm text-gray-500">(indisponível)</span>}
                    </span>
                    {option.priceCents > 0 && <span className="font-medium">+ {formatCents(option.priceCents)}</span>}
                  </label>
                </li>
              ))}
            </ul>
            <p id={`erro-${group.id}`} role="alert" className="mt-2 text-sm text-red-700">
              {errors[group.id]}
            </p>
          </fieldset>
        )
      })}

      <label className="mb-4 block">
        <span className="mb-1 block font-medium">Quantidade</span>
        <input
          type="number"
          min={1}
          max={product.maxQuantity}
          value={quantity}
          onChange={(event) => {
            setAdded(false)
            setQuantity(Math.max(1, Math.min(product.maxQuantity, Number(event.target.value) || 1)))
          }}
          className="w-24 rounded-md border px-3 py-2"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block font-medium">Observações (opcional)</span>
        <input
          type="text"
          maxLength={280}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="w-full rounded-md border px-3 py-2"
        />
      </label>

      <button
        type="submit"
        disabled={!product.available}
        className="w-full rounded-md bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        Adicionar à sacola
      </button>
      <p role="status" className="mt-2 text-sm text-gray-700">
        {!product.available ? (
          "Produto indisponível no momento."
        ) : added ? (
          <>
            Adicionado à sacola.{" "}
            <Link href="/delivery-express/cart" className="underline">
              Ver sacola
            </Link>
          </>
        ) : null}
      </p>
    </form>
  )
}
