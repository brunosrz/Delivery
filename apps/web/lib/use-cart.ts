"use client"

import { useCallback, useSyncExternalStore } from "react"
import { type Cart, loadCart, saveCart } from "@/lib/cart"

const CHANGE_EVENT = "delivery-express:cart-change"

// useSyncExternalStore exige um snapshot estável: reaproveita o objeto enquanto o texto salvo não mudar.
let lastRaw: string | null | undefined
let lastCart: Cart | null = null

function snapshot(): Cart | null {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem("delivery-express:cart:v1")
  } catch {
    return lastCart
  }
  if (raw !== lastRaw) {
    lastRaw = raw
    lastCart = loadCart(window.localStorage)
  }
  return lastCart
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

/** Sacola persistida no navegador, compartilhada entre abas e componentes. No servidor é sempre vazia. */
export function useCart(): [Cart | null, (next: Cart | null) => void] {
  const cart = useSyncExternalStore(subscribe, snapshot, () => null)
  const update = useCallback((next: Cart | null) => {
    saveCart(window.localStorage, next)
    lastRaw = undefined
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])
  return [cart, update]
}
