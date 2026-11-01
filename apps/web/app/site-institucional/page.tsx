import Link from "next/link"

export default function InstitutionalSitePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Site institucional</h1>
      <p className="text-lg mb-4">
        Apresentação do ecossistema Delivery Express e dos restaurantes parceiros, com informações para clientes e
        estabelecimentos.
      </p>
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Funcionalidades</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Páginas de apresentação dos restaurantes</li>
          <li>Cardápios digitais</li>
          <li>Calculadora de ROI</li>
          <li>
            <Link href="/site-institucional/contato" className="underline">
              Formulário de contato
            </Link>
          </li>
          <li>Blog com conteúdo sobre gastronomia e delivery</li>
        </ul>
      </div>
    </div>
  )
}
