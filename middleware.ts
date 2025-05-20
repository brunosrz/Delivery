import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

// Rotas que requerem autenticação
const protectedRoutes = [
  "/delivery-express/profile",
  "/delivery-express/orders",
  "/delivery-express/checkout",
  "/administrativo",
  "/pedidos-na-mao",
  "/ta-na-entrega",
]

// Rotas de autenticação
const authRoutes = ["/auth/login", "/auth/register"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verifica se a rota atual requer autenticação
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // Verifica se a rota atual é uma rota de autenticação
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Obtém o token de autenticação
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Redireciona para login se tentar acessar rota protegida sem autenticação
  if (isProtectedRoute && !token) {
    const url = new URL("/auth/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // Redireciona para home se tentar acessar rota de autenticação já estando autenticado
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// Configuração para quais rotas o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas protegidas e rotas de autenticação
     */
    ...protectedRoutes,
    ...authRoutes,
  ],
}
