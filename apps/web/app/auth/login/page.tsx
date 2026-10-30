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

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = safeRedirectPath(searchParams.get("callbackUrl"))
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setIsLoading(true)
    setError("")

    const { error: signInError } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    })

    setIsLoading(false)
    if (signInError) {
      setError(signInError.status === 401 ? "E-mail ou senha incorretos." : "Não foi possível entrar agora.")
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">Entrar</h1>
        <CardDescription>Use seu e-mail e senha para acessar.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          Não tem uma conta?{" "}
          <Link href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="underline">
            Criar conta
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}
