/** SHA-256 em hexadecimal. Usado para guardar IP e identificadores só como hash salgado, nunca em claro. */
export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

/** Hash com o segredo da aplicação e um domínio: o mesmo IP gera hashes diferentes em usos diferentes. */
export const saltedHash = (env: Env, scope: string, value: string) =>
  sha256(`${env.BETTER_AUTH_SECRET}:${scope}:${value}`)
