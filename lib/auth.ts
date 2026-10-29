import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Função para obter o cliente Supabase para o servidor
export const getServerSupabaseClient = () => {
  const cookieStore = cookies()

  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

// Função para obter o usuário atual no servidor
export async function getCurrentUser() {
  const supabase = getServerSupabaseClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return null
    }

    const { data: user } = await supabase.auth.getUser()

    return user?.user || null
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error)
    return null
  }
}

// Função para verificar se o usuário está autenticado no servidor
export async function isAuthenticated() {
  const user = await getCurrentUser()
  return !!user
}

// Função para verificar se o usuário tem uma determinada função
export async function hasRole(role: string) {
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  // Verificar a função do usuário
  return user.user_metadata?.role === role
}
