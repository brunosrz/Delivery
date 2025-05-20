export default function AdministrativoPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Administrativo</h1>
      <p className="text-lg mb-4">
        Painel administrativo para gestão da plataforma, usuários, restaurantes e configurações do sistema.
      </p>
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Funcionalidades</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Gestão de usuários e permissões</li>
          <li>Cadastro e aprovação de restaurantes</li>
          <li>Monitoramento de atividades</li>
          <li>Relatórios gerenciais</li>
          <li>Configurações da plataforma</li>
          <li>Gestão de pagamentos e comissões</li>
          <li>Suporte ao cliente</li>
        </ul>
      </div>
    </div>
  )
}
