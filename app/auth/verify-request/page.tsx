"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VerifyRequestPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || "seu email"

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verifique seu email</CardTitle>
          <CardDescription className="text-center">Enviamos um link de verificação para {email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="bg-blue-50 p-4 rounded-md text-blue-700 text-sm">
            <p>Por favor, verifique sua caixa de entrada e clique no link de verificação para ativar sua conta.</p>
            <p className="mt-2">Se você não receber o email em alguns minutos, verifique sua pasta de spam.</p>
          </div>

          <div className="flex justify-center">
            <svg className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">Voltar para o login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
