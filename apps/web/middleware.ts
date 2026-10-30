import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"
import { isAuthRoute as matchesAuthRoute, isProtectedRoute as matchesProtectedRoute } from "@/lib/route-access"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verifica se a rota atual requer autenticação
  const isProtectedRoute = matchesProtectedRoute(pathname)

  // Verifica se a rota atual é uma rota de autenticação
  const isAuthRoute = matchesAuthRoute(pathname)

  // Obtém o token de autenticação
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Redireciona para login se tentar acessar rota protegida sem autenticação
  if (isProtectedRoute && !token) {
    const url = new URL("/auth/login", request.url)
    // Caminho relativo: evita codificação dupla e redirecionamento para outro host.
    url.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(url)
  }

  // Redireciona para home se tentar acessar rota de autenticação já estando autenticado
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// Next.js requires this matcher to be statically analyzable at build time.
export const config = {
  matcher: [
    "/delivery-express/profile/:path*",
    "/delivery-express/orders/:path*",
    "/delivery-express/checkout/:path*",
    "/pedidos-na-mao/:path*",
    "/ta-na-entrega/:path*",
    "/auth/login/:path*",
    "/auth/register/:path*",
  ],
}
