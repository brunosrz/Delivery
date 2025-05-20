import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"

interface PromoBadgeProps {
  children: ReactNode
}

export function PromoBadge({ children }: PromoBadgeProps) {
  return <Badge className="bg-blue-500 text-white">% {children}</Badge>
}
