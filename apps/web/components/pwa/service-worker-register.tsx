"use client"

import { useEffect } from "react"

/** Registra o service worker só em produção e só no escopo do app, para não interferir no resto do site. */
export function ServiceWorkerRegister({ scope }: { scope: string }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js", { scope }).catch(() => undefined)
  }, [scope])
  return null
}
