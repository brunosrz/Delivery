import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Singleton para evitar múltiplas instâncias no cliente
let supabaseClient: ReturnType<typeof createBrowserSupabaseClient> | null = null

export const createBrowserSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Use essa função para obter o cliente do Supabase no lado do cliente
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createBrowserSupabaseClient()
  }
  return supabaseClient
}
