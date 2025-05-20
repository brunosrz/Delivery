// Schema do banco de dados para o Delivery Express
// Este arquivo define os tipos e interfaces para as tabelas do banco de dados

export interface Restaurant {
  id: string
  name: string
  restaurant_slug: string
  logo_url?: string
  cover_url?: string
  description?: string
  email?: string
  phone?: string
  cnpj?: string
  address: string
  cep?: string
  latitude: number
  longitude: number
  frete_fixo?: number
  frete_limite_km?: number
  frete_por_km_excedente?: number
  open_hours?: Record<string, any> // JSONB
  is_open?: boolean
  delivery_enabled?: boolean
  pickup_enabled?: boolean
  domain?: string
  priority?: number
  created_at?: Date
  updated_at?: Date
}

export interface Product {
  id: string
  restaurant_id: string
  title: string
  description?: string
  image_url?: string
  price: number
  product_slug: string
  priority?: number
  available?: boolean
  created_at?: Date
  updated_at?: Date
  // Campos adicionados
  original_price?: number
  discount_percentage?: number
  featured?: boolean
  nutritional_info?: Record<string, any> // JSONB
  ingredients?: string[]
  preparation_time?: number // em minutos
  tags?: string[]
}

export interface MenuSection {
  id: string
  restaurant_id: string
  title: string
  is_recommended?: boolean
  priority?: number
  created_at?: Date
  updated_at?: Date
}

export interface MenuSectionProduct {
  id: string
  section_id: string
  product_id: string
}

export interface AddonGroup {
  id: string
  product_id: string
  title: string
  min: number
  max?: number
  required?: boolean
  created_at?: Date
  updated_at?: Date
}

export interface Addon {
  id: string
  group_id: string
  title: string
  price: number
  created_at?: Date
  updated_at?: Date
}

export interface Order {
  id: string
  restaurant_id: string
  user_id?: string
  status: OrderStatus
  total: number
  subtotal: number
  delivery_fee?: number
  address?: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  notes?: string
  created_at?: Date
  updated_at?: Date
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  notes?: string
  addons_json?: Record<string, any> // JSONB
}

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PREPARING = "preparing",
  READY = "ready",
  DELIVERING = "delivering",
  DELIVERED = "delivered",
  CANCELED = "canceled",
}

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  PIX = "pix",
  CASH = "cash",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}
