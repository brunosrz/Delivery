import Link from "next/link"

export function AccessDenied({ product, requirement }: { product: string; requirement: string }) {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="mb-4 text-3xl font-bold">{product}</h1>
      <div role="alert" className="mx-auto max-w-md rounded-lg border bg-white p-6">
        <h2 className="mb-2 text-xl font-semibold">Acesso restrito</h2>
        <p className="mb-4 text-gray-700">{requirement}</p>
        <Link href="/" className="underline">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
