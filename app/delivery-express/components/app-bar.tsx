"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ShoppingBag, User } from "lucide-react"

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
}

export function AppBar() {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      icon: <Home size={24} />,
      label: "Início",
      href: "/delivery-express",
    },
    {
      icon: <ShoppingBag size={24} />,
      label: "Pedidos",
      href: "/delivery-express/orders",
    },
    {
      icon: <User size={24} />,
      label: "Perfil",
      href: "/delivery-express/profile",
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center ${isActive ? "text-orange-600" : "text-gray-500"}`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
