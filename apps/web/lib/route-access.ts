// Rotas que exigem sessão. O matcher estático em middleware.ts precisa
// acompanhar esta lista (verificado em tests/unit/middleware.test.ts).
export const protectedRoutes = [
  "/delivery-express/profile",
  "/delivery-express/orders",
  "/delivery-express/checkout",
  "/pedidos-na-mao",
  "/ta-na-entrega",
] as const

// Telas de login e cadastro, das quais um usuário autenticado é redirecionado.
export const authRoutes = ["/auth/login", "/auth/register"] as const

// "/pedidos-na-mao" cobre "/pedidos-na-mao" e "/pedidos-na-mao/...", mas não "/pedidos-na-mao-x".
export function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`)
}

export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => matchesRoute(pathname, route))
}

export function isAuthRoute(pathname: string): boolean {
  return authRoutes.some((route) => matchesRoute(pathname, route))
}
