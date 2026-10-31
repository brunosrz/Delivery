export function CatalogUnavailable({ title }: { title: string }) {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <div role="alert" className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Catálogo indisponível</h2>
        <p className="text-gray-600">Não foi possível carregar os restaurantes agora. Tente novamente mais tarde.</p>
      </div>
    </div>
  )
}
