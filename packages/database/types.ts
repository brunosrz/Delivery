export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
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
          open_hours?: Json
          is_open?: boolean
          delivery_enabled?: boolean
          pickup_enabled?: boolean
          domain?: string
          priority?: number
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
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
          open_hours?: Json
          is_open?: boolean
          delivery_enabled?: boolean
          pickup_enabled?: boolean
          domain?: string
          priority?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          restaurant_slug?: string
          logo_url?: string
          cover_url?: string
          description?: string
          email?: string
          phone?: string
          cnpj?: string
          address?: string
          cep?: string
          latitude?: number
          longitude?: number
          frete_fixo?: number
          frete_limite_km?: number
          frete_por_km_excedente?: number
          open_hours?: Json
          is_open?: boolean
          delivery_enabled?: boolean
          pickup_enabled?: boolean
          domain?: string
          priority?: number
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          restaurant_id: string
          title: string
          description?: string
          image_url?: string
          price: number
          product_slug: string
          priority?: number
          available?: boolean
          created_at?: string
          updated_at?: string
          original_price?: number
          discount_percentage?: number
          featured?: boolean
          nutritional_info?: Json
          ingredients?: string[]
          preparation_time?: number
          tags?: string[]
        }
        Insert: {
          id?: string
          restaurant_id: string
          title: string
          description?: string
          image_url?: string
          price: number
          product_slug: string
          priority?: number
          available?: boolean
          created_at?: string
          updated_at?: string
          original_price?: number
          discount_percentage?: number
          featured?: boolean
          nutritional_info?: Json
          ingredients?: string[]
          preparation_time?: number
          tags?: string[]
        }
        Update: {
          id?: string
          restaurant_id?: string
          title?: string
          description?: string
          image_url?: string
          price?: number
          product_slug?: string
          priority?: number
          available?: boolean
          updated_at?: string
          original_price?: number
          discount_percentage?: number
          featured?: boolean
          nutritional_info?: Json
          ingredients?: string[]
          preparation_time?: number
          tags?: string[]
        }
      }
      // Adicione outras tabelas conforme necessário
    }
  }
}
