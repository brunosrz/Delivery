"use client"

import { createAuthClient } from "better-auth/react"

// Sem baseURL: o cliente usa a origem atual e fala com o proxy /api/auth do próprio site.
export const authClient = createAuthClient()
