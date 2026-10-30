"use server"

// O carrinho persistente ainda não existe: a jornada real (carrinho no
// servidor, preço recalculado no backend e pedido idempotente) é a issue #18.
// Até lá esta action apenas valida a entrada e não grava nada.
export async function addToCart(formData: FormData): Promise<void> {
  const productId = formData.get("productId")
  const quantity = Number.parseInt(String(formData.get("quantity") ?? "1"), 10)

  if (typeof productId !== "string" || !productId || !Number.isSafeInteger(quantity) || quantity <= 0) {
    console.error("addToCart: entrada inválida")
  }
}
