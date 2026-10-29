import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getFromCacheOrFetch } from "@/lib/redis-client"

export async function GET() {
  try {
    const restaurants = await getFromCacheOrFetch(
      "restaurants:all",
      async () => {
        const supabase = createServerSupabaseClient()
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .order("priority", { ascending: false })
          .order("name")

        if (error) {
          console.error("Erro ao buscar restaurantes:", error)
          throw error
        }

        return data
      },
      1800, // Cache por 30 minutos
    )

    return NextResponse.json(restaurants)
  } catch (error) {
    console.error("Erro na rota de restaurantes:", error)
    return NextResponse.json({ error: "Erro ao buscar restaurantes" }, { status: 500 })
  }
}
