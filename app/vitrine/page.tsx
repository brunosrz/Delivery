export default function VitrinePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Vitrine</h1>
      <p className="text-lg mb-4">
        Site de apresentação dos restaurantes parceiros, funcionando como uma vitrine digital para atrair clientes.
      </p>
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Funcionalidades</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Páginas de apresentação dos restaurantes</li>
          <li>Cardápios digitais</li>
          <li>Calculadora de ROI</li>
          <li>Formulários de contato</li>
          <li>Blog com conteúdo sobre gastronomia e delivery</li>
        </ul>
      </div>
    </div>
  )
}
