import NextAuth from "next-auth"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { createClient } from "@supabase/supabase-js"

// Inicializa o cliente Supabase para autenticação
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const handler = NextAuth({
  // Configuração do adaptador Supabase
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),

  // Configuração de provedores de autenticação
  providers: [
    // Provedor de credenciais (email/senha)
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Autenticar usando Supabase Auth
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error || !data.user) {
            console.error("Erro de autenticação:", error)
            return null
          }

          // Buscar informações adicionais do usuário se necessário
          const { data: userData } = await supabase.from("users").select("*").eq("id", data.user.id).single()

          return {
            id: data.user.id,
            email: data.user.email,
            name: userData?.name || data.user.email?.split("@")[0],
            image: userData?.image,
          }
        } catch (error) {
          console.error("Erro no authorize:", error)
          return null
        }
      },
    }),

    // Provedor Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // Páginas personalizadas
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/register",
  },

  // Callbacks para personalizar o comportamento
  callbacks: {
    async jwt({ token, user }) {
      // Adicionar dados do usuário ao token JWT
      if (user) {
        token.id = user.id
        token.role = user.role || "user"
      }
      return token
    },

    async session({ session, token }) {
      // Adicionar dados do token à sessão
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },

  // Configurações de sessão
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  // Configurações de segurança
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
})

export { handler as GET, handler as POST }
