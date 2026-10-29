// TODO: Este arquivo precisa ser adaptado para usar Supabase em vez de Neon
import { NextResponse } from "next/server"

// Simulação de banco de dados
const menuItems = {
  "1": [
    {
      id: "1",
      restaurantId: "1",
      name: "Pizza Margherita",
      description: "Molho de tomate, mussarela, manjericão",
      price: 45.0,
      image: "/placeholder-gpo89.png",
      category: "Pizzas",
      available: true,
      featured: true,
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z",
    },
    {
      id: "2",
      restaurantId: "1",
      name: "Pizza Calabresa",
      description: "Molho de tomate, mussarela, calabresa, cebola",
      price: 50.0,
      image: "/placeholder-gpo89.png",
      category: "Pizzas",
      available: true,
      featured: false,
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z",
    },
  ],
  "2": [
    {
      id: "3",
      restaurantId: "2",
      name: "Hambúrguer Clássico",
      description: "Pão, hambúrguer, queijo, alface, tomate, cebola",
      price: 25.0,
      image: "/placeholder-f1lru.png",
      category: "Hambúrgueres",
      available: true,
      featured: true,
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z",
    },
    {
      id: "4",
      restaurantId: "2",
      name: "Hambúrguer Bacon",
      description: "Pão, hambúrguer, queijo, bacon, alface, tomate, cebola",
      price: 30.0,
      image: "/placeholder-f1lru.png",
      category: "Hambúrgueres",
      available: true,
      featured: false,
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z",
    },
  ],
}

export async function GET(request: Request, { params }: { params: { restaurantId: string } }) {
  const { restaurantId } = params

  if (!menuItems[restaurantId]) {
    return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 })
  }

  return NextResponse.json(menuItems[restaurantId])
}

export async function POST(request: Request, { params }: { params: { restaurantId: string } }) {
  try {
    const { restaurantId } = params
    const body = await request.json()

    if (!menuItems[restaurantId]) {
      menuItems[restaurantId] = []
    }

    // Aqui você implementaria a lógica real de criação de item de menu
    // Este é apenas um exemplo para demonstração
    const newMenuItem = {
      id: (menuItems[restaurantId].length + 1).toString(),
      restaurantId,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Em um cenário real, você salvaria no banco de dados
    menuItems[restaurantId].push(newMenuItem)

    return NextResponse.json(newMenuItem, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar item de menu" }, { status: 400 })
  }
}
