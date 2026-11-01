import type { Locale } from "@/lib/locale"
import type { LegalContent } from "./types"

// Política de Cookies. A lista abaixo é a lista real: se o site passar a gravar outro cookie ou item de
// armazenamento local, inclua aqui, classifique a categoria e, se não for essencial, ligue-o ao consentimento
// (hasConsent em lib/consent.ts). Há um teste que impede cookie novo sem registro.

export const COOKIE_REGISTRY = [
  { name: "better-auth.session_token", category: "necessary", maxAge: "7 days" },
  { name: "PARAGLIDE_LOCALE", category: "necessary", maxAge: "400 days" },
  { name: "consent", category: "necessary", maxAge: "365 days" },
] as const

const pt: LegalContent = {
  title: "Política de Cookies",
  intro:
    "Cookies são pequenos arquivos que o site grava no seu navegador. Aqui está o que usamos, para quê e como você controla. Hoje o site usa apenas cookies essenciais; não há cookies de estatística nem de marketing.",
  sections: [
    {
      id: "lista",
      title: "1. O que o site grava",
      blocks: [
        {
          table: {
            head: ["Nome", "Categoria", "Para quê", "Duração"],
            rows: [
              ["better-auth.session_token", "Essencial", "Mantém você conectado. HttpOnly, SameSite=Lax.", "7 dias"],
              ["PARAGLIDE_LOCALE", "Essencial", "Lembra o idioma que você escolheu.", "400 dias"],
              ["consent", "Essencial", "Guarda a sua escolha sobre cookies.", "12 meses"],
            ],
          },
        },
        {
          p: 'Armazenamento local do navegador (não é cookie): "delivery-express:cart:v1" guarda a sua sacola neste aparelho, e "theme" guarda o tema visual. Ambos ficam só no seu aparelho e não são enviados a ninguém.',
        },
      ],
    },
    {
      id: "categorias",
      title: "2. Categorias",
      blocks: [
        {
          ul: [
            "Essenciais: necessários para o site funcionar (login, idioma, esta escolha). Não dependem de consentimento.",
            "Estatística: medem o uso de forma agregada. Não usamos nenhum hoje.",
            "Marketing: anúncios e medição de campanhas. Não usamos nenhum hoje.",
          ],
        },
        {
          p: "Se um dia passarmos a usar cookies de estatística ou marketing, eles só serão carregados depois do seu consentimento, e a lista acima será atualizada.",
        },
      ],
    },
    {
      id: "controle",
      title: "3. Como você controla",
      blocks: [
        {
          ul: [
            'Em "Preferências de cookies", no rodapé de qualquer página, você aceita, recusa ou muda as categorias a qualquer momento.',
            "A recusa é tão fácil quanto o aceite. Sem escolha sua, os cookies opcionais ficam desligados.",
            "Respeitamos o sinal Global Privacy Control do navegador como recusa de estatística e marketing.",
            "A sua escolha vale por 12 meses; depois, perguntamos de novo. Também perguntamos de novo se a lista de categorias mudar.",
            "Você também pode apagar cookies nas configurações do navegador; isso desconecta a sua conta.",
          ],
        },
      ],
    },
    {
      id: "prova",
      title: "4. Registro da sua escolha",
      blocks: [
        {
          p: "Para provar o consentimento, guardamos no servidor um identificador aleatório do navegador, a sua escolha, a versão da lista, o idioma, o instante e um hash do IP. Se você estiver conectado, o registro fica ligado à sua conta e entra na exportação dos seus dados; ao excluir a conta, o vínculo é desfeito.",
        },
      ],
    },
  ],
}

const en: LegalContent = {
  title: "Cookie Policy",
  intro:
    "Cookies are small files the site stores in your browser. Here is what we use, what for and how you control it. Today the site only uses essential cookies; there are no analytics or marketing cookies.",
  sections: [
    {
      id: "lista",
      title: "1. What the site stores",
      blocks: [
        {
          table: {
            head: ["Name", "Category", "Purpose", "Duration"],
            rows: [
              ["better-auth.session_token", "Essential", "Keeps you signed in. HttpOnly, SameSite=Lax.", "7 days"],
              ["PARAGLIDE_LOCALE", "Essential", "Remembers the language you chose.", "400 days"],
              ["consent", "Essential", "Stores your cookie choice.", "12 months"],
            ],
          },
        },
        {
          p: 'Browser local storage (not a cookie): "delivery-express:cart:v1" keeps your bag on this device, and "theme" keeps the visual theme. Both stay on your device only and are not sent to anyone.',
        },
      ],
    },
    {
      id: "categorias",
      title: "2. Categories",
      blocks: [
        {
          ul: [
            "Essential: needed for the site to work (sign-in, language, this choice). They do not depend on consent.",
            "Analytics: measure usage in aggregate. We use none today.",
            "Marketing: ads and campaign measurement. We use none today.",
          ],
        },
        {
          p: "If we ever start using analytics or marketing cookies, they will only load after your consent, and the list above will be updated.",
        },
      ],
    },
    {
      id: "controle",
      title: "3. How you control it",
      blocks: [
        {
          ul: [
            'Under "Cookie preferences", in the footer of any page, you can accept, reject or change the categories at any time.',
            "Rejecting is as easy as accepting. Without a choice from you, optional cookies stay off.",
            "We honor the browser's Global Privacy Control signal as a refusal of analytics and marketing.",
            "Your choice lasts 12 months; then we ask again. We also ask again if the list of categories changes.",
            "You can also delete cookies in your browser settings; this signs you out.",
          ],
        },
      ],
    },
    {
      id: "prova",
      title: "4. Record of your choice",
      blocks: [
        {
          p: "To prove consent, we store on the server a random browser identifier, your choice, the version of the list, the language, the time and a hash of the IP. If you are signed in, the record is linked to your account and included in your data export; when you delete the account, the link is removed.",
        },
      ],
    },
  ],
}

export const cookies: Record<Locale, LegalContent> = { "pt-BR": pt, en }
