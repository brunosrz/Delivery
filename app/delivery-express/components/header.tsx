"use client"

import type React from "react"

import { type ReactNode, useState } from "react"
import Link from "next/link"
import { Search, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"

interface HeaderProps {
  onSearch?: (query: string) => void
  children?: ReactNode
  showBackButton?: boolean
  title?: string
}

export function Header({ onSearch, children, showBackButton = false, title }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-3 mb-2">
          {showBackButton && (
            <Link href="/delivery-express" className="p-1">
              <ArrowLeft size={24} />
            </Link>
          )}

          {title ? (
            <h1 className="text-xl font-bold">{title}</h1>
          ) : (
            <form className="relative flex-1" onSubmit={handleSearch}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Buscar Pratos"
                className="pl-10 pr-4 py-2 w-full rounded-full border-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          )}
        </div>

        {children}
      </div>
    </header>
  )
}
