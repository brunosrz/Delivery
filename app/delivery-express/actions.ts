"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { invalidateCache } from "@/lib/redis-client"
import { revalidatePath } from "next/cache"

// Ação para adicionar um produto ao carrinho
export async function addToCart(formData: FormData) {
  try {
    const productId = formData.get("productId") as string
    const quantity = Number.parseInt(formData.get("quantity") as string, 10)
    const notes = formData.get("notes") as string

    // Aqui você implementaria a lógica para adicionar ao carrinho
    // Isso poderia ser armazenado no Redis, em uma tabela do Supabase, etc.

    // Por enquanto, apenas retornamos sucesso
    return { success: true, message: "Produto adicionado ao carrinho" }
  } catch (error) {
    console.error("Erro ao adicionar ao carrinho:", error)
    return { success: false, message: "Erro ao adicionar produto ao carrinho" }
  }
}

// Ação para criar um novo restaurante (exemplo de admin)
export async function createRestaurant(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const slug = formData.get("slug") as string
    const address = formData.get("address") as string
    const latitude = Number.parseFloat(formData.get("latitude") as string)
    const longitude = Number.parseFloat(formData.get("longitude") as string)

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        name,
        restaurant_slug: slug,
        address,
        latitude,
        longitude,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar restaurante:", error)
      return { success: false, message: "Erro ao criar restaurante" }
    }

    // Invalida o cache de restaurantes
    await invalidateCache("restaurants:all")

    // Revalida a página de restaurantes
    revalidatePath("/delivery-express")

    return { success: true, message: "Restaurante criado com sucesso", data }
  } catch (error) {
    console.error("Erro ao criar restaurante:", error)
    return { success: false, message: "Erro ao criar restaurante" }
  }
}
