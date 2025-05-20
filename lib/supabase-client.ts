import { createClient } from "@supabase/supabase-js"

// Você precisará adicionar estas variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Cria um cliente Supabase para uso no lado do cliente
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Para uso no lado do servidor com a chave de serviço (mais permissões)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
      },
    })
  : supabaseClient
