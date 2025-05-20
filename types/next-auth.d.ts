import "next-auth"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Estende o objeto User padrão
   */
  interface User {
    id: string
    role?: string
  }

  /**
   * Estende o objeto Session padrão
   */
  interface Session {
    user: {
      id: string
      role?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  /**
   * Estende o objeto JWT padrão
   */
  interface JWT {
    id: string
    role?: string
  }
}
