"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuantitySelectorProps {
  initialQuantity?: number
  min?: number
  max?: number
  onChange?: (quantity: number) => void
}

export function QuantitySelector({ initialQuantity = 1, min = 1, max = 99, onChange }: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(initialQuantity)

  const increment = () => {
    if (quantity < max) {
      const newQuantity = quantity + 1
      setQuantity(newQuantity)
      onChange?.(newQuantity)
    }
  }

  const decrement = () => {
    if (quantity > min) {
      const newQuantity = quantity - 1
      setQuantity(newQuantity)
      onChange?.(newQuantity)
    }
  }

  return (
    <div className="flex items-center border rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={decrement}
        disabled={quantity <= min}
        className="h-10 w-10 rounded-none border-r"
      >
        <Minus size={16} />
      </Button>

      <div className="w-12 text-center font-medium">{quantity}</div>

      <Button
        variant="ghost"
        size="icon"
        onClick={increment}
        disabled={quantity >= max}
        className="h-10 w-10 rounded-none border-l"
      >
        <Plus size={16} />
      </Button>
    </div>
  )
}
