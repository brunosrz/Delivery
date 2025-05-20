"use server"

import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

interface CartItem {
  id: string
  productId: string
  productSlug: string
  title: string
  price: number
  quantity: number
  imageUrl?: string
  addons?: {
    id: string
    title: string
    price: number
  }[]
}

interface Cart {
  id: string
  restaurantId: string
  restaurantSlug: string
  restaurantName: string
  items: CartItem[]
}

export async function addToCart(
  productId: string,
  productSlug: string,
  title: string,
  price: number,
  quantity = 1,
  imageUrl?: string,
  restaurantId?: string,
  restaurantSlug?: string,
  restaurantName?: string,
  addons?: { id: string; title: string; price: number }[],
) {
  const cookieStore = cookies()
  let cart: Cart | null = null
  const cartCookie = cookieStore.get("cart")

  if (cartCookie) {
    try {
      cart = JSON.parse(cartCookie.value)
    } catch (e) {
      console.error("Erro ao parsear cookie do carrinho:", e)
    }
  }

  // Se não tiver carrinho ou o restaurante for diferente, cria um novo
  if (!cart || (restaurantId && cart.restaurantId !== restaurantId)) {
    if (!restaurantId || !restaurantSlug || !restaurantName) {
      throw new Error("Dados do restaurante são necessários para criar um novo carrinho")
    }

    cart = {
      id: uuidv4(),
      restaurantId,
      restaurantSlug,
      restaurantName,
      items: [],
    }
  }

  // Verifica se o produto já está no carrinho
  const existingItemIndex = cart.items.findIndex((item) => item.productId === productId)

  if (existingItemIndex >= 0) {
    // Atualiza a quantidade se o produto já estiver no carrinho
    cart.items[existingItemIndex].quantity += quantity
  } else {
    // Adiciona novo item ao carrinho
    cart.items.push({
      id: uuidv4(),
      productId,
      productSlug,
      title,
      price,
      quantity,
      imageUrl,
      addons,
    })
  }

  // Salva o carrinho no cookie
  cookieStore.set("cart", JSON.stringify(cart), {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    httpOnly: true,
    sameSite: "strict",
  })

  return cart
}
