"use client"

import { Button } from "@/components/ui/button"

export interface NavCategory {
  id: string
  name: string
  color: string
}

interface NavbarProps {
  categories: NavCategory[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
}

export function Navbar({ categories, activeCategory, onCategoryChange }: NavbarProps) {
  const getButtonClasses = (category: NavCategory) => {
    const isActive = activeCategory === category.id

    const colorMap: Record<string, { active: string; inactive: string }> = {
      orange: {
        active: "bg-orange-500 hover:bg-orange-600 text-white",
        inactive: "bg-orange-100 hover:bg-orange-200 text-orange-800",
      },
      red: {
        active: "bg-red-500 hover:bg-red-600 text-white",
        inactive: "bg-red-100 hover:bg-red-200 text-red-800",
      },
      amber: {
        active: "bg-amber-500 hover:bg-amber-600 text-white",
        inactive: "bg-amber-100 hover:bg-amber-200 text-amber-800",
      },
      purple: {
        active: "bg-purple-500 hover:bg-purple-600 text-white",
        inactive: "bg-purple-100 hover:bg-purple-200 text-purple-800",
      },
      blue: {
        active: "bg-blue-500 hover:bg-blue-600 text-white",
        inactive: "bg-blue-100 hover:bg-blue-200 text-blue-800",
      },
      green: {
        active: "bg-green-500 hover:bg-green-600 text-white",
        inactive: "bg-green-100 hover:bg-green-200 text-green-800",
      },
    }

    const colorClass = colorMap[category.color] || colorMap.orange
    return `rounded-full px-4 py-2 whitespace-nowrap ${isActive ? colorClass.active : colorClass.inactive}`
  }

  return (
    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
      {categories.map((category) => (
        <Button key={category.id} onClick={() => onCategoryChange(category.id)} className={getButtonClasses(category)}>
          {category.name}
        </Button>
      ))}
    </div>
  )
}
