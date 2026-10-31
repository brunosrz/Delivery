import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { AddonGroup } from "@delivery/contracts"
import { formatCents } from "@/lib/utils"
import { CatalogUnavailable } from "@/app/delivery-express/catalog-unavailable"
import { loadMenu } from "@/app/delivery-express/menu"

export const dynamic = "force-dynamic"

function selectionRule(group: AddonGroup): string {
  if (group.minSelections === 0)
    return group.maxSelections === 1 ? "Opcional, escolha até 1" : `Opcional, até ${group.maxSelections}`
  if (group.minSelections === group.maxSelections) return `Obrigatório, escolha ${group.minSelections}`
  return `Obrigatório, de ${group.minSelections} a ${group.maxSelections}`
}

function AddonGroupFieldset({ group }: { group: AddonGroup }) {
  const single = group.maxSelections === 1
  return (
    <fieldset className="mb-6 rounded-lg border p-4">
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
                  value={option.id}
                  disabled={!option.available}
                />
                {option.name}
                {!option.available && <span className="text-sm text-gray-500">(indisponível)</span>}
              </span>
              {option.priceCents > 0 && <span className="font-medium">+ {formatCents(option.priceCents)}</span>}
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params
  const loaded = await loadMenu(slug)
  if (loaded.status === "unavailable") return <CatalogUnavailable title="Delivery Express" />

  const { restaurant, sections } = loaded.menu
  const product = sections.flatMap((section) => section.products).find((candidate) => candidate.slug === productSlug)
  if (!product) notFound()

  return (
    <div className="container mx-auto px-4 py-8">
      <nav aria-label="Navegação estrutural" className="mb-6 text-sm">
        <Link href={`/delivery-express/restaurant/${restaurant.slug}`} className="underline">
          {restaurant.name}
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          <Image src={product.imageUrl ?? "/placeholder.svg"} alt="" fill className="object-cover" priority />
        </div>

        <div>
          <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>
          {product.description && <p className="mb-4 text-gray-700">{product.description}</p>}
          <p className="mb-6">
            <span className="text-2xl font-bold text-orange-700">{formatCents(product.priceCents)}</span>
            {product.originalPriceCents !== null && product.originalPriceCents > product.priceCents && (
              <span className="ml-2 text-gray-500 line-through">
                <span className="sr-only">de </span>
                {formatCents(product.originalPriceCents)}
              </span>
            )}
          </p>

          <form aria-describedby="carrinho-status">
            {product.addonGroups.map((group) => (
              <AddonGroupFieldset key={group.id} group={group} />
            ))}

            <label className="mb-4 block">
              <span className="mb-1 block font-medium">Quantidade</span>
              <input
                type="number"
                name="quantity"
                min={1}
                max={product.maxQuantity}
                defaultValue={1}
                className="w-24 rounded-md border px-3 py-2"
              />
            </label>

            <button
              type="submit"
              disabled
              className="w-full rounded-md bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
            >
              Adicionar à sacola
            </button>
            <p id="carrinho-status" className="mt-2 text-sm text-gray-600">
              {product.available
                ? "A sacola e o checkout ainda estão em desenvolvimento (issue #18)."
                : "Produto indisponível no momento."}
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
