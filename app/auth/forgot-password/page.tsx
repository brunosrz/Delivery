"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

// Cliente Supabase para o lado do cliente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }

      setIsSubmitted(true)
    } catch (error: any) {
      console.error("Erro ao enviar email de recuperação:", error)
      setError("Ocorreu um erro ao enviar o email de recuperação. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Email enviado</CardTitle>
            <CardDescription className="text-center">Enviamos instruções para recuperar sua senha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="bg-green-50 p-4 rounded-md text-green-700 text-sm">
              <p>
                Enviamos um email para <strong>{email}</strong> com instruções para recuperar sua senha.
              </p>
              <p className="mt-2">Verifique sua caixa de entrada e siga as instruções no email.</p>
            </div>

            <div className="flex justify-center">
              <svg className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <Button asChild className="w-full">
              <Link href="/auth/login">Voltar para o login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Recuperar senha</CardTitle>
          <CardDescription className="text-center">
            Digite seu email para receber instruções de recuperação de senha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 p-3 rounded-md text-red-500 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar instruções"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Lembrou sua senha?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Voltar para o login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
