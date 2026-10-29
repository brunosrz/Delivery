import type { ReactNode } from "react"

interface FlexGridProps {
  children: ReactNode
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: string
  className?: string
}

export function FlexGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "gap-4",
  className = "",
}: FlexGridProps) {
  // Configurar classes de grid responsivo baseado nos parâmetros
  const gridClasses = [
    "grid",
    gap,
    `grid-cols-${columns.mobile}`,
    `sm:grid-cols-${columns.tablet || columns.mobile}`,
    `lg:grid-cols-${columns.desktop || columns.tablet || columns.mobile}`,
    className,
  ].join(" ")

  return <div className={gridClasses}>{children}</div>
}
