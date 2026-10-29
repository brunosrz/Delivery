import { SectionHeader } from "./section-header"
import { FoodGrid } from "./food-grid"
import type { ReactNode } from "react"

interface CategorySectionProps {
  id: string
  title: string
  children: ReactNode
}

export function CategorySection({ id, title, children }: CategorySectionProps) {
  return (
    <section id={id} className="py-4 scroll-mt-32">
      <SectionHeader title={title} />
      <div className="px-4 max-w-7xl mx-auto w-full">
        <FoodGrid>{children}</FoodGrid>
      </div>
    </section>
  )
}
