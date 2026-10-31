import { z } from "zod"
import { Id } from "./common.js"

export const Role = z.enum(["customer", "restaurant_staff", "courier", "admin"])
export type Role = z.infer<typeof Role>

export const SessionUser = z.object({
  id: Id,
  email: z.email(),
  name: z.string().min(1).max(120),
  role: Role,
  /** Restaurantes em que o usuário atua (vazio para clientes). */
  restaurantIds: z.array(Id),
})
export type SessionUser = z.infer<typeof SessionUser>
