export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          name: string
          restaurant_slug: string
          logo_url: string | null
          cover_url: string | null
          description: string | null
          email: string | null
          phone: string | null
          cnpj: string | null
          address: string
          cep: string | null
          latitude: number
          longitude: number
          frete_fixo: number | null
          frete_limite_km: number | null
          frete_por_km_excedente: number | null
          open_hours: Json | null
          is_open: boolean | null
          delivery_enabled: boolean | null
          pickup_enabled: boolean | null
          domain: string | null
          priority: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          restaurant_slug: string
          logo_url?: string | null
          cover_url?: string | null
          description?: string | null
          email?: string | null
          phone?: string | null
          cnpj?: string | null
          address: string
          cep?: string | null
          latitude: number
          longitude: number
          frete_fixo?: number | null
          frete_limite_km?: number | null
          frete_por_km_excedente?: number | null
          open_hours?: Json | null
          is_open?: boolean | null
          delivery_enabled?: boolean | null
          pickup_enabled?: boolean | null
          domain?: string | null
          priority?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          restaurant_slug?: string
          logo_url?: string | null
          cover_url?: string | null
          description?: string | null
          email?: string | null
          phone?: string | null
          cnpj?: string | null
          address?: string
          cep?: string | null
          latitude?: number
          longitude?: number
          frete_fixo?: number | null
          frete_limite_km?: number | null
          frete_por_km_excedente?: number | null
          open_hours?: Json | null
          is_open?: boolean | null
          delivery_enabled?: boolean | null
          pickup_enabled?: boolean | null
          domain?: string | null
          priority?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          restaurant_id: string
          title: string
          description: string | null
          image_url: string | null
          price: number
          product_slug: string
          priority: number | null
          available: boolean | null
          original_price: number | null
          discount_percentage: number | null
          featured: boolean | null
          nutritional_info: Json | null
          ingredients: string[] | null
          preparation_time: number | null
          tags: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          restaurant_id: string
          title: string
          description?: string | null
          image_url?: string | null
          price: number
          product_slug: string
          priority?: number | null
          available?: boolean | null
          original_price?: number | null
          discount_percentage?: number | null
          featured?: boolean | null
          nutritional_info?: Json | null
          ingredients?: string[] | null
          preparation_time?: number | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          restaurant_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          price?: number
          product_slug?: string
          priority?: number | null
          available?: boolean | null
          original_price?: number | null
          discount_percentage?: number | null
          featured?: boolean | null
          nutritional_info?: Json | null
          ingredients?: string[] | null
          preparation_time?: number | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      menu_sections: {
        Row: {
          id: string
          restaurant_id: string
          title: string
          is_recommended: boolean | null
          priority: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          restaurant_id: string
          title: string
          is_recommended?: boolean | null
          priority?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          restaurant_id?: string
          title?: string
          is_recommended?: boolean | null
          priority?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      menu_section_products: {
        Row: {
          id: string
          section_id: string
          product_id: string
        }
        Insert: {
          id?: string
          section_id: string
          product_id: string
        }
        Update: {
          id?: string
          section_id?: string
          product_id?: string
        }
      }
      addon_groups: {
        Row: {
          id: string
          product_id: string
          title: string
          min: number
          max: number | null
          required: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          title: string
          min?: number
          max?: number | null
          required?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          title?: string
          min?: number
          max?: number | null
          required?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      addons: {
        Row: {
          id: string
          group_id: string
          title: string
          price: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          title: string
          price: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          title?: string
          price?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          restaurant_id: string
          user_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          subtotal: number
          delivery_fee: number | null
          address: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          restaurant_id: string
          user_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total: number
          subtotal: number
          delivery_fee?: number | null
          address?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          restaurant_id?: string
          user_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          subtotal?: number
          delivery_fee?: number | null
          address?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          notes: string | null
          addons_json: Json | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          notes?: string | null
          addons_json?: Json | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          notes?: string | null
          addons_json?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status: "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "canceled"
      payment_method: "credit_card" | "debit_card" | "pix" | "cash"
      payment_status: "pending" | "paid" | "failed" | "refunded"
    }
  }
}
