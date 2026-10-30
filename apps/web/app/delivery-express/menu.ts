import { notFound } from "next/navigation"
import type { Menu } from "@delivery/contracts"
import { getApiClient } from "@/lib/api"

export type MenuLoad = { status: "ok"; menu: Menu } | { status: "unavailable" }

/** Carrega o cardápio: 404 do backend vira notFound(); falha de rede ou contrato vira "indisponível". */
export async function loadMenu(slug: string): Promise<MenuLoad> {
  const result = await getApiClient()?.getMenu(slug)
  if (!result) return { status: "unavailable" }
  if (result.ok) return { status: "ok", menu: result.data }
  if (result.error.code === "not_found" || result.error.code === "bad_request") notFound()
  return { status: "unavailable" }
}
