"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QuantitySelector } from "./quantity-selector"
import { CartButton } from "./cart-button"

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    title: string
    description: string
    price: number
    image_url: string
  }
}

export function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleAddToCart = async () => {
    setLoading(true)

    try {
      // Simulação de adição ao carrinho
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Fechar modal após adicionar ao carrinho
      onClose()
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product.title}</DialogTitle>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.title}
            className="w-full h-48 object-cover rounded-md"
          />

          <p className="text-gray-600">{product.description}</p>

          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-orange-600">R$ {product.price.toFixed(2).replace(".", ",")}</div>

            <QuantitySelector initialQuantity={quantity} onChange={setQuantity} />
          </div>

          <div className="pt-4">
            <CartButton onClick={handleAddToCart} loading={loading} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
