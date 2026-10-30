import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "lucide-react"

const COMPONENTS = [
  {
    title: "API v1 (Hono em Cloudflare Workers)",
    description: "Rotas versionadas com schemas zod, OpenAPI gerada e envelope de erro único com requestId.",
    issues: [1, 6],
  },
  {
    title: "Banco relacional (Cloudflare D1)",
    description: "Restaurantes, cardápio, pedidos e usuários com migrações versionadas e restaurant_id obrigatório.",
    issues: [4, 14],
  },
  {
    title: "Tempo real (Durable Objects)",
    description:
      "Um objeto por restaurante serializa as transições de pedido, aplica idempotência e distribui eventos por WebSocket.",
    issues: [18],
  },
  {
    title: "Identidade e permissões",
    description:
      "Login único para cliente, restaurante, entregador e administração, com papéis aplicados em cada rota.",
    issues: [14],
  },
  {
    title: "Serviço de preço em Rust",
    description: "Cotação do carrinho em workers-rs, comparada em modo sombra com a implementação TypeScript.",
    issues: [15],
  },
]

const REPOSITORY_URL = "https://github.com/brunosrz/Delivery"

export default function CasaDasMaquinasPage() {
  return (
    <main className="container mx-auto px-4 py-10">
      <header className="mb-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <Database className="h-8 w-8" aria-hidden="true" />
          <h1 className="text-4xl font-bold">Casa das Máquinas</h1>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Parcial
          </Badge>
        </div>
        <p className="text-xl text-gray-600">
          Backend centralizado do ecossistema: uma única API para o Delivery Express, o Pedidos na Mão e o Tá na
          Entrega. A API v1 de catálogo já existe em `apps/casa-das-maquinas` com testes no runtime do Workers; pedidos,
          autenticação e tempo real estão nas próximas etapas.
        </p>
      </header>

      <section aria-labelledby="componentes" className="mb-10">
        <h2 id="componentes" className="text-2xl font-semibold mb-4">
          Componentes
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {COMPONENTS.map((component) => (
            <li key={component.title}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{component.title}</CardTitle>
                  <CardDescription>{component.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-gray-500">
                  Issues:{" "}
                  {component.issues.map((issue, index) => (
                    <span key={issue}>
                      {index > 0 && ", "}
                      <a className="underline" href={`${REPOSITORY_URL}/issues/${issue}`}>
                        #{issue}
                      </a>
                    </span>
                  ))}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="escolha" className="max-w-3xl">
        <h2 id="escolha" className="text-2xl font-semibold mb-4">
          Por que Cloudflare
        </h2>
        <p className="text-gray-700">
          O painel do restaurante e o app do entregador precisam de conexões longas para receber pedidos e status em
          tempo real. Durable Objects com WebSocket Hibernation mantêm essas conexões no plano gratuito sem cobrar o
          tempo ocioso, enquanto o plano gratuito do Supabase pausa projetos após uma semana sem uso.
        </p>
      </section>
    </main>
  )
}
