import type React from "react"
interface SectionContainerProps {
  children: React.ReactNode
  className?: string
}

export function SectionContainer({ children, className = "" }: SectionContainerProps) {
  return <div className={`w-full max-w-7xl mx-auto px-4 ${className}`}>{children}</div>
}
