// Compartilhamento de materiais do MKit. Sem integração com credenciais: o texto vai por link do WhatsApp (wa.me) ou
// para a área de transferência, e quem publica é a própria pessoa no app dela.

/** O WhatsApp aceita textos longos, mas o link precisa caber nos limites de URL dos navegadores. */
export const SHARE_TEXT_LIMIT = 1500

export type Shareable = { title: string; body: string }

/** Texto que vai na mensagem: título em destaque, corpo e um corte seguro no limite. */
export function shareText(material: Shareable): string {
  const text = `*${material.title}*\n\n${material.body}`.trim()
  if (text.length <= SHARE_TEXT_LIMIT) return text
  return `${text.slice(0, SHARE_TEXT_LIMIT - 1).trimEnd()}…`
}

/** Link `https://wa.me/?text=...`; o texto é sempre codificado, então nada do material vira parte do endereço. */
export const whatsappUrl = (material: Shareable): string =>
  `https://wa.me/?text=${encodeURIComponent(shareText(material))}`

/** Legenda pronta para colar no Instagram, Facebook ou onde for (corpo, sem formatação do WhatsApp). */
export const captionText = (material: Shareable): string => `${material.title}\n\n${material.body}`.trim()
