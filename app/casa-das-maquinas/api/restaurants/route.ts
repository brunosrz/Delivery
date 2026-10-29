// TODO: Este arquivo precisa ser adaptado para usar Supabase em vez de Neon
import { NextResponse } from "next/server"

// Simulação de banco de dados
const restaurants = [
  {
    id: "1",
    name: "Pizzaria do João",
    slug: "pizzaria-do-joao",
    logo: "/placeholder-gpo89.png",
    coverImage: "/placeholder-f1lru.png",
    address: "Rua das Pizzas, 123",
    phone: "(11) 99999-9999",
    email: "contato@pizzariadojoao.com.br",
    description: "A melhor pizzaria da cidade",
    openingHours: "18:00 - 23:00",
    deliveryFee: 5.0,
    minimumOrder: 20.0,
    categories: ["Pizza", "Italiana"],
    rating: 4.8,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Hamburgueria do Zé",
    slug: "hamburgueria-do-ze",
    logo: "/placeholder-gpo89.png",
    coverImage: "/placeholder-f1lru.png",
    address: "Rua dos Hambúrgueres, 456",
    phone: "(11) 88888-8888",
    email: "contato@hamburgueriadoze.com.br",
    description: "Os melhores hambúrgueres artesanais",
    openingHours: "18:00 - 23:00",
    deliveryFee: 7.0,
    minimumOrder: 25.0,
    categories: ["Hambúrguer", "Lanches"],
    rating: 4.5,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
]

export async function GET() {
  return NextResponse.json(restaurants)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Aqui você implementaria a lógica real de criação de restaurante
    // Este é apenas um exemplo para demonstração
    const newRestaurant = {
      id: (restaurants.length + 1).toString(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Em um cenário real, você salvaria no banco de dados
    restaurants.push(newRestaurant)

    return NextResponse.json(newRestaurant, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar restaurante" }, { status: 400 })
  }
}
