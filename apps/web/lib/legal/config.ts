// Quem é o controlador dos dados. Vem do ambiente porque muda de instalação para instalação; nada aqui é inventado.
// Configure NEXT_PUBLIC_CONTROLLER_NAME, NEXT_PUBLIC_CONTROLLER_TAX_ID e NEXT_PUBLIC_PRIVACY_EMAIL (ver .envs.example).

export type Controller = { name: string | null; taxId: string | null; privacyEmail: string | null }

const clean = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function readController(env: Record<string, string | undefined> = process.env): Controller {
  return {
    name: clean(env.NEXT_PUBLIC_CONTROLLER_NAME),
    taxId: clean(env.NEXT_PUBLIC_CONTROLLER_TAX_ID),
    privacyEmail: clean(env.NEXT_PUBLIC_PRIVACY_EMAIL),
  }
}

/** Só aceita e-mail com formato simples, para o link `mailto:` nunca carregar texto estranho. */
export const isPlausibleEmail = (value: string | null): value is string =>
  value !== null && /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(value)
