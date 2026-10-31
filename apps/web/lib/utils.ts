import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

/** Formata centavos inteiros como reais. A divisão só acontece na exibição. */
export function formatCents(cents: number): string {
  return BRL.format(cents / 100)
}
