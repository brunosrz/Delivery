import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"

interface SizeBadgeProps {
  children: ReactNode
}

export function SizeBadge({ children }: SizeBadgeProps) {
  return (
    <Badge variant="outline" className="border-gray-300 text-gray-600">
      {children}
    </Badge>
  )
}
