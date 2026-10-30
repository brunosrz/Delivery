import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: restaurants, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("priority", { ascending: false })
      .order("name")

    if (error) {
      console.error("Erro ao buscar restaurantes:", error)
      throw error
    }

    return NextResponse.json(restaurants)
  } catch (error) {
    console.error("Erro na rota de restaurantes:", error)
    return NextResponse.json({ error: "Erro ao buscar restaurantes" }, { status: 500 })
  }
}
