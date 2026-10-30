"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Mapeamento de erros para mensagens amigáveis
const errorMessages: Record<string, string> = {
  Configuration: "Ocorreu um erro na configuração do servidor.",
  AccessDenied: "Acesso negado. Você não tem permissão para acessar este recurso.",
  Verification: "O link de verificação expirou ou já foi usado.",
  Default: "Ocorreu um erro durante a autenticação.",
}

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error") || "Default"

  const errorMessage = errorMessages[error] || errorMessages.Default

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Erro de autenticação</CardTitle>
          <CardDescription className="text-center">
            Ocorreu um problema durante o processo de autenticação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="bg-red-50 p-4 rounded-md text-red-700 text-sm">{errorMessage}</div>

          <div className="flex justify-center">
            <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/auth/login">Voltar para o login</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Ir para a página inicial</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
