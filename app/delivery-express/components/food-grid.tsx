"use client"

import type { ReactNode } from "react"
import "../styles/food-card.css"

interface FoodGridProps {
  children: ReactNode
  className?: string
}

export function FoodGrid({ children, className = "" }: FoodGridProps) {
  return <div className={`food-grid ${className}`}>{children}</div>
}
