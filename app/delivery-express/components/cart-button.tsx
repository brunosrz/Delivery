"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CartButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

export function CartButton({ onClick, disabled = false, loading = false }: CartButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled || loading} className="bg-orange-500 hover:bg-orange-600 text-white">
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          Adicionando...
        </div>
      ) : (
        <div className="flex items-center">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Adicionar ao carrinho
        </div>
      )}
    </Button>
  )
}
