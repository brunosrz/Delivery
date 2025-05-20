import { Redis } from "@upstash/redis"

// Exportar tipos e interfaces
export * from "./schema"

// Configuração do cliente Redis
export const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Funções de utilidade para produtos
// export async function getProductBySlug(slug: string) {
//   const product = await sql`
//     SELECT p.*, r.name as restaurant_name, r.restaurant_slug
//     FROM products p
//     JOIN restaurants r ON p.restaurant_id = r.id
//     WHERE p.product_slug = ${slug} AND p.available = true
//   `

//   return product[0] || null
// }

// export async function getProductAddons(productId: string) {
//   const addonGroups = await sql`
//     SELECT ag.*, json_agg(a.*) as addons
//     FROM addon_groups ag
//     LEFT JOIN addons a ON a.group_id = ag.id
//     WHERE ag.product_id = ${productId}
//     GROUP BY ag.id
//     ORDER BY ag.title
//   `

//   return addonGroups
// }

// export async function getRelatedProducts(productId: string, restaurantId: string, limit = 4) {
//   const relatedProducts = await sql`
//     SELECT p.*
//     FROM products p
//     WHERE p.restaurant_id = ${restaurantId}
//       AND p.id != ${productId}
//       AND p.available = true
//     ORDER BY p.priority DESC NULLS LAST, RANDOM()
//     LIMIT ${limit}
//   `

//   return relatedProducts
// }

// export async function getProductCategories(productId: string) {
//   const categories = await sql`
//     SELECT ms.*
//     FROM menu_sections ms
//     JOIN menu_section_products msp ON msp.section_id = ms.id
//     WHERE msp.product_id = ${productId}
//     ORDER BY ms.priority DESC NULLS LAST, ms.title
//   `

//   return categories
// }

// Funções de utilidade para cache Redis
export async function cacheProduct(slug: string, product: any) {
  await redis.set(`product:${slug}`, JSON.stringify(product), {
    ex: 3600, // Expirar em 1 hora
  })
}

export async function getCachedProduct(slug: string) {
  const cached = await redis.get(`product:${slug}`)
  return cached ? JSON.parse(cached as string) : null
}

export async function invalidateProductCache(slug: string) {
  await redis.del(`product:${slug}`)
}
