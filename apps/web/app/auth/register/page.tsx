"use client"

import { type FormEvent, Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authClient } from "@/lib/auth-client"
import { safeRedirectPath } from "@/lib/safe-redirect"

const MIN_PASSWORD_LENGTH = 8

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = safeRedirectPath(searchParams.get("callbackUrl"))
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password"))
    if (password !== String(form.get("confirmPassword"))) {
      setError("As senhas não coincidem.")
      return
    }

    setIsLoading(true)
    setError("")
    const { error: signUpError } = await authClient.signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password,
    })
    setIsLoading(false)

    if (signUpError) {
      setError(
        signUpError.status === 422 || signUpError.code === "USER_ALREADY_EXISTS"
          ? "Já existe uma conta com este e-mail."
          : "Não foi possível criar a conta. Verifique os dados e tente novamente.",
      )
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">Criar conta</h1>
        <CardDescription>Cadastre-se para fazer pedidos.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" autoComplete="name" required maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              aria-describedby="password-hint"
              required
            />
            <p id="password-hint" className="text-sm text-gray-600">
              Pelo menos {MIN_PASSWORD_LENGTH} caracteres.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          Já tem uma conta?{" "}
          <Link href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="underline">
            Entrar
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </main>
  )
}
