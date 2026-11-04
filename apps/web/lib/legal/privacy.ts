import type { Locale } from "@/lib/locale"
import type { LegalContent } from "./types"

// Política de Privacidade. Os prazos de retenção acompanham apps/api/src/retention.ts e os dados
// listados acompanham o que o código realmente grava. Mudou um, mude o outro e
// suba LEGAL_VERSIONS.privacy em @delivery/contracts para pedir novo aceite.

const pt: LegalContent = {
  title: "Política de Privacidade",
  intro:
    "Esta política explica quais dados pessoais o Delivery Express trata, para quê, por quanto tempo e como você exerce seus direitos. Ela segue a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018) e também descreve os direitos de quem está na União Europeia, no Espaço Econômico Europeu e no Reino Unido (GDPR e UK GDPR) e nos Estados Unidos (CCPA/CPRA e leis estaduais equivalentes).",
  sections: [
    {
      id: "controlador",
      title: "1. Quem é o controlador",
      blocks: [
        {
          p: 'O controlador é a organização que opera esta instalação do Delivery Express, identificada no quadro "Controlador" no topo desta página. O canal de privacidade (encarregado pelo tratamento de dados pessoais, ou DPO) é o e-mail indicado ali. Cada restaurante parceiro é controlador independente dos dados que usa para preparar e entregar o pedido que você fez a ele.',
        },
      ],
    },
    {
      id: "dados",
      title: "2. Quais dados tratamos",
      blocks: [
        {
          table: {
            head: ["Dado", "De onde vem", "Observação"],
            rows: [
              ["Nome, e-mail e senha", "Cadastro", "A senha é guardada só como hash; nunca em texto."],
              [
                "Itens, valores, modalidade (entrega ou retirada), status e histórico do pedido",
                "Pedido",
                "Necessários para o restaurante preparar e para você acompanhar.",
              ],
              ["Endereço de entrega", "Pedido de entrega", "Visível para o restaurante e para o entregador do pedido."],
              [
                "Forma e situação do pagamento",
                "Pagamento",
                "Para Pix e cartão, nome, CPF/CNPJ, e-mail e telefone informados vão direto ao processador de pagamento (Asaas) e não ficam salvos aqui. Os dados do cartão nunca passam por nós: a digitação é feita na página do Asaas.",
              ],
              ["Nome, e-mail e mensagem", "Formulário de contato", "Usados para responder você."],
              [
                "Hash do IP (nunca o IP)",
                "Qualquer requisição",
                "Usado só para limitar abuso e para provar o consentimento de cookies. O hash tem sal secreto e não permite descobrir o IP.",
              ],
              [
                "Registros técnicos (identificador da requisição, caminho, status e duração)",
                "Servidor",
                "Não incluem corpo da requisição, cookies, senhas nem cabeçalhos de autenticação.",
              ],
              [
                "Escolha de cookies, aceite dos termos e solicitações de privacidade",
                "Você",
                "Servem de prova do que você escolheu e de que atendemos seus pedidos.",
              ],
            ],
          },
        },
        {
          p: "Não coletamos localização, dados biométricos, dados de saúde, origem racial ou étnica, convicção religiosa ou política, nem dados de crianças. Não fazemos decisões exclusivamente automatizadas que produzam efeito jurídico sobre você nem criamos perfis de comportamento.",
        },
      ],
    },
    {
      id: "bases",
      title: "3. Para quê usamos e em qual base legal",
      blocks: [
        {
          table: {
            head: ["Finalidade", "LGPD (art. 7º)", "GDPR (art. 6)"],
            rows: [
              [
                "Criar a conta, receber e entregar pedidos, processar pagamentos",
                "V – execução de contrato",
                "6(1)(b) – contrato",
              ],
              [
                "Guardar pedidos e registros fiscais mesmo após você excluir a conta",
                "II – obrigação legal ou regulatória",
                "6(1)(c) – obrigação legal",
              ],
              [
                "Segurança, prevenção a fraude e a abuso, limites de requisição",
                "IX – legítimo interesse",
                "6(1)(f) – interesse legítimo",
              ],
              [
                "Responder mensagens do formulário de contato",
                "V – procedimentos preliminares de contrato",
                "6(1)(b)/(f)",
              ],
              ["Cookies de estatística e marketing (hoje não usados)", "I – consentimento", "6(1)(a) – consentimento"],
              [
                "Provar o consentimento, o aceite dos termos e o atendimento às suas solicitações",
                "II e IX",
                "6(1)(c) e (f)",
              ],
            ],
          },
        },
        {
          p: "Onde a base é o consentimento, você pode retirá-lo quando quiser, e isso não afeta o que foi feito antes.",
        },
      ],
    },
    {
      id: "compartilhamento",
      title: "4. Com quem compartilhamos",
      blocks: [
        {
          ul: [
            "O restaurante do seu pedido: itens, observações, nome e, na entrega, o endereço.",
            "O entregador: o endereço e os dados necessários da entrega pronta que ele aceitou.",
            "Asaas (processamento de pagamentos, no Brasil): os dados que você informa para pagar online.",
            "Cloudflare (API, banco de dados e rede) e Vercel (site): provedores de infraestrutura que armazenam e processam os dados em nosso nome, sob contrato.",
            "Google, somente se você escolher entrar com a conta Google e o recurso estiver ativo: dados básicos do perfil.",
            "Autoridades, quando a lei ou ordem judicial exigir.",
          ],
        },
        {
          p: 'Não vendemos dados pessoais nem os compartilhamos para publicidade comportamental entre contextos ("sell" ou "share" no sentido da CCPA/CPRA).',
        },
      ],
    },
    {
      id: "transferencias",
      title: "5. Transferências internacionais",
      blocks: [
        {
          p: "A infraestrutura (Cloudflare e Vercel) pode processar dados fora do Brasil, inclusive nos Estados Unidos. Isso é feito com as garantias da LGPD (art. 33) e, para dados de pessoas na UE/EEE/Reino Unido, com cláusulas contratuais padrão e outras salvaguardas do GDPR (capítulo V) oferecidas por esses provedores.",
        },
      ],
    },
    {
      id: "retencao",
      title: "6. Por quanto tempo guardamos",
      blocks: [
        {
          table: {
            head: ["Dado", "Prazo"],
            rows: [
              ["Conta (nome, e-mail, credenciais)", "Até você excluir a conta"],
              ["Sessão de login", "7 dias, ou até você sair; a exclusão da conta encerra todas as sessões"],
              [
                "Pedidos",
                "Mantidos pelo prazo das obrigações fiscais e financeiras; ao excluir a conta, o endereço é apagado e o pedido perde o vínculo com você",
              ],
              ["Mensagens do formulário de contato", "12 meses; apagadas antes se você excluir a conta"],
              [
                "Prova de consentimento de cookies",
                "5 anos, sem vínculo com a sua identidade depois da exclusão da conta",
              ],
              ["Registro de solicitações de privacidade", "5 anos, apenas com hash, sem dado pessoal"],
              ["Contadores de limite de requisição", "24 horas"],
              ["Tokens de verificação e redefinição de senha", "Até expirarem"],
            ],
          },
        },
      ],
    },
    {
      id: "direitos",
      title: "7. Seus direitos (LGPD, art. 18)",
      blocks: [
        {
          ul: [
            "Confirmação de que tratamos seus dados e acesso a eles.",
            "Correção de dados incompletos, inexatos ou desatualizados.",
            "Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.",
            "Portabilidade dos dados.",
            "Eliminação dos dados tratados com base no consentimento.",
            "Informação sobre com quem compartilhamos.",
            "Informação sobre a possibilidade de não consentir e suas consequências, e revogação do consentimento.",
            "Oposição a tratamento feito com base em outra hipótese que não o consentimento, e revisão de decisões automatizadas.",
          ],
        },
        {
          p: "Como exercer: logado, use a página Privacidade (Perfil → Privacidade) para baixar uma cópia dos seus dados e para excluir a conta. Para os demais pedidos, escreva ao canal de privacidade. Respondemos em até 15 dias (LGPD, art. 19). Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).",
        },
        {
          p: "Por segurança, a exclusão da conta exige uma sessão iniciada nos últimos 15 minutos e a digitação de uma frase de confirmação.",
        },
      ],
    },
    {
      id: "gdpr",
      title: "8. Se você está na UE, no EEE ou no Reino Unido (GDPR)",
      blocks: [
        {
          p: "Você tem os direitos de acesso (art. 15), retificação (16), apagamento (17), limitação do tratamento (18), portabilidade (20), oposição (21) e de retirar o consentimento (7(3)), e de não ser sujeito a decisão exclusivamente automatizada (22). Respondemos em até um mês (art. 12(3)). Você pode reclamar à autoridade de proteção de dados do seu país. Se esta instalação oferecer serviço a pessoas na UE, o representante exigido pelo art. 27 será indicado no quadro do controlador.",
        },
      ],
    },
    {
      id: "eua",
      title: "9. Se você está nos Estados Unidos (CCPA/CPRA e leis estaduais)",
      blocks: [
        {
          p: "Nos últimos 12 meses coletamos, para as finalidades da seção 3, estas categorias: identificadores (nome, e-mail), informações comerciais (pedidos), atividade na internet (registros técnicos) e dados de endereço de entrega. Não coletamos informações pessoais sensíveis (como CPF armazenado, localização precisa ou dados de saúde). Não vendemos nem compartilhamos informações pessoais para publicidade comportamental.",
        },
        {
          p: "Residentes na Califórnia e em outros estados com lei própria (como Virgínia, Colorado e Connecticut) podem pedir para saber, acessar, corrigir e apagar suas informações, limitar o uso de informações sensíveis e recusar a venda ou o compartilhamento. Não discriminamos quem exerce esses direitos. Respeitamos o sinal Global Privacy Control do navegador como pedido de recusa. Você pode usar um agente autorizado; podemos pedir confirmação de identidade e do mandato. Se negarmos um pedido, você pode recorrer escrevendo ao canal de privacidade.",
        },
      ],
    },
    {
      id: "criancas",
      title: "10. Crianças e adolescentes",
      blocks: [
        {
          p: "O serviço é destinado a maiores de 18 anos. Não coletamos conscientemente dados de menores de 18 anos nem, em nenhuma hipótese, de menores de 13 anos (COPPA) ou 16 anos (GDPR, art. 8). Se soubermos que isso ocorreu, apagaremos os dados.",
        },
      ],
    },
    {
      id: "seguranca",
      title: "11. Segurança",
      blocks: [
        {
          ul: [
            "Conexões protegidas por HTTPS, com HSTS, e cabeçalhos de segurança (CSP, proteção contra incorporação em frames, X-Content-Type-Options).",
            "Senhas guardadas com hash; cookie de sessão HttpOnly e SameSite, nunca legível por script.",
            "Respostas com dados pessoais não ficam em cache.",
            "Isolamento por restaurante: a equipe de um restaurante só vê os pedidos dele, e o entregador só vê entregas prontas ou as que despachou.",
            "Limite de requisições contra abuso, validação de todas as entradas e registros técnicos sem conteúdo sensível.",
            "Exclusão e exportação exigem sessão e confirmação; as solicitações ficam registradas sem dado pessoal.",
          ],
        },
        {
          p: "Se houver um incidente de segurança que possa causar risco ou dano relevante, comunicaremos a ANPD e os titulares afetados nos prazos da LGPD (art. 48) e, quando aplicável, a autoridade europeia em até 72 horas (GDPR, arts. 33 e 34).",
        },
      ],
    },
    {
      id: "cookies",
      title: "12. Cookies",
      blocks: [
        {
          p: 'O uso de cookies e armazenamento local está descrito na Política de Cookies. Você muda suas escolhas a qualquer momento em "Preferências de cookies", no rodapé.',
        },
      ],
    },
    {
      id: "mudancas",
      title: "13. Mudanças nesta política",
      blocks: [
        {
          p: "Quando alterarmos esta política de forma relevante, publicaremos uma nova versão com a data e pediremos novo aceite no próximo acesso. As versões anteriores ficam registradas junto com o seu aceite.",
        },
      ],
    },
  ],
}

const en: LegalContent = {
  title: "Privacy Policy",
  intro:
    "This policy explains which personal data Delivery Express processes, why, for how long, and how you can exercise your rights. It follows the Brazilian General Data Protection Law (LGPD, Law 13,709/2018) and also describes the rights of people in the European Union, the European Economic Area and the United Kingdom (GDPR and UK GDPR) and in the United States (CCPA/CPRA and equivalent state laws).",
  sections: [
    {
      id: "controlador",
      title: "1. Who is the controller",
      blocks: [
        {
          p: 'The controller is the organization that operates this installation of Delivery Express, identified in the "Controller" box at the top of this page. The privacy contact (the data protection officer, or DPO) is the email shown there. Each partner restaurant is an independent controller of the data it uses to prepare and deliver the order you placed with it.',
        },
      ],
    },
    {
      id: "dados",
      title: "2. What data we process",
      blocks: [
        {
          table: {
            head: ["Data", "Where it comes from", "Note"],
            rows: [
              ["Name, email and password", "Sign-up", "The password is stored only as a hash, never as text."],
              [
                "Items, amounts, fulfillment (delivery or pickup), status and history of the order",
                "Order",
                "Needed for the restaurant to prepare it and for you to follow it.",
              ],
              ["Delivery address", "Delivery order", "Visible to the restaurant and to the courier of the order."],
              [
                "Payment method and status",
                "Payment",
                "For Pix and card, the name, tax ID, email and phone you enter go straight to the payment processor (Asaas) and are not stored here. Card data never passes through us: you type it on Asaas's page.",
              ],
              ["Name, email and message", "Contact form", "Used to answer you."],
              [
                "IP hash (never the IP)",
                "Any request",
                "Used only to limit abuse and to prove cookie consent. The hash uses a secret salt and cannot be reversed to the IP.",
              ],
              [
                "Technical logs (request id, path, status and duration)",
                "Server",
                "They do not include the request body, cookies, passwords or authentication headers.",
              ],
              [
                "Cookie choice, acceptance of the terms and privacy requests",
                "You",
                "They prove what you chose and that we handled your requests.",
              ],
            ],
          },
        },
        {
          p: "We do not collect location, biometric data, health data, racial or ethnic origin, religious or political beliefs, or data from children. We do not make decisions based solely on automated processing that produce legal effects on you, and we do not build behavioral profiles.",
        },
      ],
    },
    {
      id: "bases",
      title: "3. What we use it for and the legal basis",
      blocks: [
        {
          table: {
            head: ["Purpose", "LGPD (art. 7)", "GDPR (art. 6)"],
            rows: [
              [
                "Create the account, receive and deliver orders, process payments",
                "V – contract performance",
                "6(1)(b) – contract",
              ],
              [
                "Keep orders and tax records even after you delete your account",
                "II – legal or regulatory obligation",
                "6(1)(c) – legal obligation",
              ],
              [
                "Security, fraud and abuse prevention, request limits",
                "IX – legitimate interest",
                "6(1)(f) – legitimate interest",
              ],
              ["Answer messages from the contact form", "V – pre-contractual steps", "6(1)(b)/(f)"],
              ["Analytics and marketing cookies (not used today)", "I – consent", "6(1)(a) – consent"],
              ["Prove consent, acceptance of the terms and handling of your requests", "II and IX", "6(1)(c) and (f)"],
            ],
          },
        },
        {
          p: "Where the basis is consent, you can withdraw it at any time, and this does not affect what was done before.",
        },
      ],
    },
    {
      id: "compartilhamento",
      title: "4. Who we share it with",
      blocks: [
        {
          ul: [
            "The restaurant of your order: items, notes, name and, for delivery, the address.",
            "The courier: the address and necessary details of the ready delivery they accepted.",
            "Asaas (payment processing, in Brazil): the data you enter to pay online.",
            "Cloudflare (API, database and network) and Vercel (website): infrastructure providers that store and process data on our behalf, under contract.",
            "Google, only if you choose to sign in with a Google account and the feature is enabled: basic profile data.",
            "Authorities, when required by law or court order.",
          ],
        },
        {
          p: 'We do not sell personal data or share it for cross-context behavioral advertising ("sell" or "share" within the meaning of the CCPA/CPRA).',
        },
      ],
    },
    {
      id: "transferencias",
      title: "5. International transfers",
      blocks: [
        {
          p: "The infrastructure (Cloudflare and Vercel) may process data outside Brazil, including in the United States. This is done with the safeguards of the LGPD (art. 33) and, for data of people in the EU/EEA/UK, with standard contractual clauses and other GDPR (chapter V) safeguards offered by those providers.",
        },
      ],
    },
    {
      id: "retencao",
      title: "6. How long we keep it",
      blocks: [
        {
          table: {
            head: ["Data", "Period"],
            rows: [
              ["Account (name, email, credentials)", "Until you delete the account"],
              ["Login session", "7 days, or until you sign out; deleting the account ends all sessions"],
              [
                "Orders",
                "Kept for the period of tax and financial obligations; when you delete the account, the address is erased and the order loses its link to you",
              ],
              ["Contact form messages", "12 months; erased earlier if you delete your account"],
              ["Proof of cookie consent", "5 years, with no link to your identity after the account is deleted"],
              ["Privacy request log", "5 years, only a hash, no personal data"],
              ["Request-limit counters", "24 hours"],
              ["Verification and password reset tokens", "Until they expire"],
            ],
          },
        },
      ],
    },
    {
      id: "direitos",
      title: "7. Your rights (LGPD, art. 18)",
      blocks: [
        {
          ul: [
            "Confirmation that we process your data and access to it.",
            "Correction of incomplete, inaccurate or outdated data.",
            "Anonymization, blocking or deletion of unnecessary data or data processed unlawfully.",
            "Data portability.",
            "Deletion of data processed on the basis of consent.",
            "Information about who we share it with.",
            "Information about the possibility of not consenting and its consequences, and withdrawal of consent.",
            "Objection to processing carried out on a basis other than consent, and review of automated decisions.",
          ],
        },
        {
          p: "How to exercise them: when signed in, use the Privacy page (Profile → Privacy) to download a copy of your data and to delete your account. For other requests, write to the privacy contact. We answer within 15 days (LGPD, art. 19). You can also file a complaint with the Brazilian data protection authority (ANPD).",
        },
        {
          p: "For security, deleting the account requires a session started in the last 15 minutes and typing a confirmation phrase.",
        },
      ],
    },
    {
      id: "gdpr",
      title: "8. If you are in the EU, the EEA or the UK (GDPR)",
      blocks: [
        {
          p: "You have the rights of access (art. 15), rectification (16), erasure (17), restriction of processing (18), portability (20), objection (21), to withdraw consent (7(3)), and not to be subject to a decision based solely on automated processing (22). We answer within one month (art. 12(3)). You may lodge a complaint with the data protection authority of your country. If this installation offers services to people in the EU, the representative required by art. 27 will be named in the controller box.",
        },
      ],
    },
    {
      id: "eua",
      title: "9. If you are in the United States (CCPA/CPRA and state laws)",
      blocks: [
        {
          p: "In the last 12 months we collected, for the purposes in section 3, these categories: identifiers (name, email), commercial information (orders), internet activity (technical logs) and delivery address data. We do not collect sensitive personal information (such as a stored tax ID, precise location or health data). We do not sell or share personal information for behavioral advertising.",
        },
        {
          p: "Residents of California and of other states with their own law (such as Virginia, Colorado and Connecticut) may ask to know, access, correct and delete their information, limit the use of sensitive information, and opt out of sale or sharing. We do not discriminate against people who exercise these rights. We honor the browser's Global Privacy Control signal as an opt-out request. You may use an authorized agent; we may ask to confirm your identity and the agent's authority. If we deny a request, you may appeal by writing to the privacy contact.",
        },
      ],
    },
    {
      id: "criancas",
      title: "10. Children and teenagers",
      blocks: [
        {
          p: "The service is intended for people over 18. We do not knowingly collect data from anyone under 18 and, in no case, from children under 13 (COPPA) or 16 (GDPR, art. 8). If we learn that this happened, we will delete the data.",
        },
      ],
    },
    {
      id: "seguranca",
      title: "11. Security",
      blocks: [
        {
          ul: [
            "HTTPS connections with HSTS, and security headers (CSP, frame embedding protection, X-Content-Type-Options).",
            "Passwords stored as hashes; the session cookie is HttpOnly and SameSite, never readable by scripts.",
            "Responses with personal data are not cached.",
            "Isolation per restaurant: a restaurant's staff only sees its own orders, and a courier only sees ready deliveries or those they dispatched.",
            "Request limits against abuse, validation of every input, and technical logs without sensitive content.",
            "Deletion and export require a session and confirmation; the requests are logged without personal data.",
          ],
        },
        {
          p: "If a security incident that may cause relevant risk or harm occurs, we will notify the ANPD and the affected people within the LGPD deadlines (art. 48) and, where applicable, the European authority within 72 hours (GDPR, arts. 33 and 34).",
        },
      ],
    },
    {
      id: "cookies",
      title: "12. Cookies",
      blocks: [
        {
          p: 'The use of cookies and local storage is described in the Cookie Policy. You can change your choices at any time under "Cookie preferences" in the footer.',
        },
      ],
    },
    {
      id: "mudancas",
      title: "13. Changes to this policy",
      blocks: [
        {
          p: "When we change this policy in a relevant way, we will publish a new version with its date and ask for new acceptance on your next visit. Previous versions are recorded together with your acceptance.",
        },
      ],
    },
  ],
}

export const privacy: Record<Locale, LegalContent> = { "pt-BR": pt, en }
