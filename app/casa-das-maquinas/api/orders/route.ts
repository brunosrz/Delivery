// TODO: Este arquivo precisa ser adaptado para usar Supabase em vez de Neon
import { NextResponse } from "next/server"

// Simulação de banco de dados
const orders = [
  {
    id: "1",
    restaurantId: "1",
    customerId: "1",
    items: [
      {
        id: "1",
        name: "Pizza Margherita",
        price: 45.0,
        quantity: 1,
      },
    ],
    status: "pending",
    total: 45.0,
    deliveryFee: 5.0,
    address: {
      street: "Rua das Flores",
      number: "123",
      complement: "Apto 101",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
    },
    paymentMethod: "credit_card",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    restaurantId: "2",
    customerId: "1",
    items: [
      {
        id: "3",
        name: "Hambúrguer Clássico",
        price: 25.0,
        quantity: 2,
      },
    ],
    status: "delivered",
    total: 50.0,
    deliveryFee: 7.0,
    address: {
      street: "Rua das Flores",
      number: "123",
      complement: "Apto 101",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
    },
    paymentMethod: "pix",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
]

export async function GET() {
  return NextResponse.json(orders)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Aqui você implementaria a lógica real de criação de pedido
    // Este é apenas um exemplo para demonstração
    const newOrder = {
      id: (orders.length + 1).toString(),
      ...body,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Em um cenário real, você salvaria no banco de dados
    orders.push(newOrder)

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 400 })
  }
}
