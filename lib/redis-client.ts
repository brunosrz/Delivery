/**
 * Funções temporárias que não usam Redis
 * Estas funções serão substituídas por implementações reais com Redis no futuro
 */

// Função temporária que apenas executa a função de busca sem cache
export async function getFromCacheOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
  // Simplesmente executa a função de busca sem cache
  return await fetchFn()
}

// Função temporária que não faz nada
export async function invalidateCache(key: string): Promise<void> {
  // Não faz nada, já que não estamos usando cache
  console.log(`[MOCK] Invalidando cache para a chave: ${key}`)
  return
}
