import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ECOSYSTEM_PRODUCTS, STATE_LABELS, type CapabilityState } from "@/lib/ecosystem-status"

const PRODUCT_IMAGES: Record<string, string> = {
  "delivery-express": "/food-delivery-app-interface.png",
  "pedidos-na-mao": "/restaurant-management-dashboard.png",
  "ta-na-entrega": "/food-delivery-driver-app.png",
  "site-institucional": "/restaurant-showcase.png",
  mkit: "/admin-dashboard-interface.png",
  "casa-das-maquinas": "/api-backend-architecture.png",
}

const STATE_STYLES: Record<CapabilityState, string> = {
  implementado: "bg-green-100 text-green-800",
  parcial: "bg-yellow-100 text-yellow-800",
  demo: "bg-blue-100 text-blue-800",
  stub: "bg-gray-200 text-gray-800",
  planejado: "bg-purple-100 text-purple-800",
}

const REPOSITORY_URL = "https://github.com/brunosrz/Delivery"

export default function EcosystemHome() {
  return (
    <main className="container mx-auto px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4">Ecossistema Delivery Express</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Produto B2B de cardápio digital e pedidos para restaurantes, em desenvolvimento aberto. Cada módulo mostra o
          estado real da implementação.
        </p>
      </header>

      <section aria-labelledby="produtos" className="mb-12">
        <h2 id="produtos" className="sr-only">
          Produtos do ecossistema
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ECOSYSTEM_PRODUCTS.map((product) => (
            <li key={product.id}>
              <Card className="h-full flex flex-col bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{product.name}</CardTitle>
                    <Badge className={STATE_STYLES[product.state]} variant="outline">
                      {STATE_LABELS[product.state]}
                    </Badge>
                  </div>
                  <CardDescription>
                    {product.audience} · {product.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="aspect-video relative mb-4 rounded-md overflow-hidden bg-gray-100">
                    <Image src={PRODUCT_IMAGES[product.id]} alt="" fill className="object-cover" />
                  </div>
                  <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                    {product.limitations.map((limitation) => (
                      <li key={limitation}>{limitation}</li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-2">
                  <Button asChild>
                    <Link href={product.route}>Abrir {product.name}</Link>
                  </Button>
                  <p className="text-xs text-gray-500">
                    Issues:{" "}
                    {product.issues.map((issue, index) => (
                      <span key={issue}>
                        {index > 0 && ", "}
                        <a className="underline" href={`${REPOSITORY_URL}/issues/${issue}`}>
                          #{issue}
                        </a>
                      </span>
                    ))}
                  </p>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="arquitetura" className="max-w-3xl mx-auto">
        <h2 id="arquitetura" className="text-2xl font-semibold mb-4">
          Arquitetura
        </h2>
        <p className="mb-2">
          <strong>Hoje:</strong> uma aplicação Next.js 15 (App Router) com rotas por produto, catálogo lido do Supabase
          e autenticação via NextAuth.
        </p>
        <p className="mb-2">
          <strong>Alvo:</strong> os frontends continuam em Next.js e consomem a Casa das Máquinas, um backend em
          Cloudflare Workers com D1, Durable Objects para tempo real e contratos versionados.
        </p>
        <p>
          O plano, as dependências e as evidências de cada etapa ficam na{" "}
          <a className="underline" href={`${REPOSITORY_URL}/issues/17`}>
            issue guarda-chuva #17
          </a>
          .
        </p>
      </section>
    </main>
  )
}
