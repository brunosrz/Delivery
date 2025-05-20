// Cliente de API para comunicar com a Casa das Máquinas

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  body?: any
  headers?: Record<string, string>
  cache?: RequestCache
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api"

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, cache } = options

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    cache,
  }

  if (body) {
    fetchOptions.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `API Error: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  // Restaurantes
  getRestaurants: () => fetchApi<any[]>("/restaurants"),
  getRestaurant: (id: string) => fetchApi<any>(`/restaurants/${id}`),
  createRestaurant: (data: any) => fetchApi<any>("/restaurants", { method: "POST", body: data }),

  // Menu
  getMenu: (restaurantId: string) => fetchApi<any[]>(`/menu/${restaurantId}`),
  createMenuItem: (restaurantId: string, data: any) =>
    fetchApi<any>(`/menu/${restaurantId}`, { method: "POST", body: data }),

  // Pedidos
  getOrders: () => fetchApi<any[]>("/orders"),
  getOrder: (id: string) => fetchApi<any>(`/orders/${id}`),
  createOrder: (data: any) => fetchApi<any>("/orders", { method: "POST", body: data }),
  updateOrderStatus: (id: string, status: string) =>
    fetchApi<any>(`/orders/${id}/status`, { method: "PATCH", body: { status } }),

  // Usuários
  getCurrentUser: () => fetchApi<any>("/users/me"),
  updateUserProfile: (data: any) => fetchApi<any>("/users/me", { method: "PUT", body: data }),
}
