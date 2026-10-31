"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

/** Atualiza a fila a cada poucos segundos enquanto a aba está visível (o tempo real por WebSocket é a evolução). */
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh()
    }, seconds * 1000)
    return () => clearInterval(id)
  }, [router, seconds])
  return null
}
