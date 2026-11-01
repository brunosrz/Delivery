import type { Locale } from "@/lib/locale"
import type { LegalContent } from "./types"

// Termos de Uso. Mudou o texto de forma relevante: suba LEGAL_VERSIONS.terms em @delivery/contracts.

const pt: LegalContent = {
  title: "Termos de Uso",
  intro:
    "Estes termos regulam o uso do Delivery Express, plataforma que conecta clientes, restaurantes parceiros e entregadores. Ao criar uma conta ou fazer um pedido, você declara que leu e aceita estes termos e a Política de Privacidade.",
  sections: [
    {
      id: "servico",
      title: "1. O serviço",
      blocks: [
        {
          p: "O Delivery Express reúne em um só lugar o catálogo dos restaurantes, o pedido, o pagamento e o acompanhamento da entrega. Somos intermediários: o preparo, a qualidade e a segurança dos alimentos são responsabilidade do restaurante, e o transporte é responsabilidade do entregador, cada um nos limites da lei.",
        },
      ],
    },
    {
      id: "conta",
      title: "2. Conta e elegibilidade",
      blocks: [
        {
          ul: [
            "O serviço é para maiores de 18 anos com capacidade civil. Ao se cadastrar você declara cumprir esse requisito.",
            "Os dados do cadastro devem ser verdadeiros e mantidos atualizados.",
            "Você é responsável por manter a senha em sigilo e por tudo o que for feito com a sua conta. Avise o canal de privacidade se suspeitar de uso indevido.",
            "Você pode excluir a conta a qualquer momento na página de Privacidade, respeitadas as regras de retenção da Política de Privacidade.",
          ],
        },
      ],
    },
    {
      id: "pedidos",
      title: "3. Pedidos e pagamentos",
      blocks: [
        {
          ul: [
            "Os preços e o total (itens, adicionais e taxa de entrega) são calculados pelo sistema e mostrados antes da confirmação; se o total mudar entre a cotação e o pedido, você é avisado e precisa confirmar de novo.",
            "O pedido só é aceito depois que o restaurante o confirma. O restaurante pode recusá-lo por indisponibilidade, e nesse caso nada é cobrado.",
            "O pagamento online (Pix ou cartão) é processado pelo Asaas, em página dele. O pagamento na entrega é combinado diretamente com o restaurante.",
            "Cancelamentos, trocas e reembolsos seguem o Código de Defesa do Consumidor e a política do restaurante. Quando o pagamento for estornado, o prazo depende do meio de pagamento.",
          ],
        },
      ],
    },
    {
      id: "conduta",
      title: "4. Uso adequado",
      blocks: [
        {
          p: "É proibido usar o serviço para fraude, para tentar acessar dados de outras pessoas ou restaurantes, para sobrecarregar ou testar a segurança do sistema sem autorização por escrito, para automatizar pedidos de forma abusiva, ou para enviar conteúdo ilegal, ofensivo ou que viole direitos de terceiros. Podemos suspender contas que descumpram estes termos.",
        },
      ],
    },
    {
      id: "restaurantes",
      title: "5. Restaurantes e entregadores",
      blocks: [
        {
          p: "Restaurantes respondem pelo cardápio, preços, disponibilidade, qualidade e conformidade sanitária, e pelo conteúdo que publicam (inclusive materiais de marketing). Entregadores respondem pela conduta e pelo cuidado com o pedido durante o transporte. Ambos devem tratar os dados dos clientes só para a finalidade do pedido.",
        },
      ],
    },
    {
      id: "propriedade",
      title: "6. Propriedade intelectual",
      blocks: [
        {
          p: "O software, a marca e o desenho da plataforma pertencem ao controlador. Textos, fotos e marcas dos restaurantes pertencem a eles, que nos autorizam a exibi-los na plataforma. Você não pode copiar, vender ou explorar esses conteúdos fora do uso normal do serviço.",
        },
      ],
    },
    {
      id: "disponibilidade",
      title: "7. Disponibilidade e responsabilidade",
      blocks: [
        {
          p: "Trabalhamos para manter o serviço disponível, mas ele pode ficar indisponível por manutenção ou por falha de terceiros. Na medida permitida pela lei, não respondemos por danos indiretos nem por falhas de internet, de provedores ou de meios de pagamento fora do nosso controle. Nada aqui limita direitos que a lei não permite limitar, como os do consumidor.",
        },
      ],
    },
    {
      id: "privacidade",
      title: "8. Privacidade",
      blocks: [
        {
          p: "O tratamento de dados pessoais está descrito na Política de Privacidade e, para cookies, na Política de Cookies. Elas fazem parte destes termos.",
        },
      ],
    },
    {
      id: "mudancas",
      title: "9. Mudanças nos termos",
      blocks: [
        {
          p: "Podemos alterar estes termos. Mudanças relevantes geram uma nova versão, publicada com a data, e pedem novo aceite no próximo acesso. Se você não concordar, pode excluir a conta.",
        },
      ],
    },
    {
      id: "lei",
      title: "10. Lei aplicável e foro",
      blocks: [
        {
          p: "Estes termos seguem as leis do Brasil. Para consumidores, fica eleito o foro do domicílio do consumidor, como prevê o Código de Defesa do Consumidor. Fora disso, o foro da sede do controlador. Para usuários de outros países, direitos obrigatórios de consumo e de proteção de dados do seu país continuam valendo.",
        },
      ],
    },
  ],
}

const en: LegalContent = {
  title: "Terms of Use",
  intro:
    "These terms govern the use of Delivery Express, a platform that connects customers, partner restaurants and couriers. By creating an account or placing an order, you state that you have read and accept these terms and the Privacy Policy.",
  sections: [
    {
      id: "servico",
      title: "1. The service",
      blocks: [
        {
          p: "Delivery Express brings together in one place restaurant catalogs, ordering, payment and delivery tracking. We are an intermediary: food preparation, quality and safety are the restaurant's responsibility, and transport is the courier's responsibility, each within the limits of the law.",
        },
      ],
    },
    {
      id: "conta",
      title: "2. Account and eligibility",
      blocks: [
        {
          ul: [
            "The service is for people over 18 with legal capacity. By signing up you declare you meet this requirement.",
            "Sign-up details must be true and kept up to date.",
            "You are responsible for keeping your password secret and for everything done with your account. Tell the privacy contact if you suspect misuse.",
            "You can delete your account at any time on the Privacy page, subject to the retention rules in the Privacy Policy.",
          ],
        },
      ],
    },
    {
      id: "pedidos",
      title: "3. Orders and payments",
      blocks: [
        {
          ul: [
            "Prices and the total (items, add-ons and delivery fee) are calculated by the system and shown before you confirm; if the total changes between the quote and the order, you are told and must confirm again.",
            "An order is only accepted after the restaurant confirms it. The restaurant may decline it for unavailability, in which case nothing is charged.",
            "Online payment (Pix or card) is processed by Asaas, on its own page. Payment on delivery is arranged directly with the restaurant.",
            "Cancellations, exchanges and refunds follow consumer protection law and the restaurant's policy. When a payment is refunded, the timing depends on the payment method.",
          ],
        },
      ],
    },
    {
      id: "conduta",
      title: "4. Acceptable use",
      blocks: [
        {
          p: "You must not use the service for fraud, to try to access other people's or restaurants' data, to overload or test the security of the system without written authorization, to automate orders abusively, or to send content that is illegal, offensive or that violates third-party rights. We may suspend accounts that breach these terms.",
        },
      ],
    },
    {
      id: "restaurantes",
      title: "5. Restaurants and couriers",
      blocks: [
        {
          p: "Restaurants are responsible for the menu, prices, availability, quality and sanitary compliance, and for the content they publish (including marketing materials). Couriers are responsible for their conduct and for taking care of the order during transport. Both must use customer data only for the purpose of the order.",
        },
      ],
    },
    {
      id: "propriedade",
      title: "6. Intellectual property",
      blocks: [
        {
          p: "The software, brand and design of the platform belong to the controller. Texts, photos and brands of restaurants belong to them, and they authorize us to display them on the platform. You may not copy, sell or exploit this content outside the normal use of the service.",
        },
      ],
    },
    {
      id: "disponibilidade",
      title: "7. Availability and liability",
      blocks: [
        {
          p: "We work to keep the service available, but it may be unavailable due to maintenance or third-party failures. To the extent permitted by law, we are not liable for indirect damages or for failures of the internet, providers or payment methods outside our control. Nothing here limits rights that the law does not allow to be limited, such as consumer rights.",
        },
      ],
    },
    {
      id: "privacidade",
      title: "8. Privacy",
      blocks: [
        {
          p: "The processing of personal data is described in the Privacy Policy and, for cookies, in the Cookie Policy. They are part of these terms.",
        },
      ],
    },
    {
      id: "mudancas",
      title: "9. Changes to the terms",
      blocks: [
        {
          p: "We may change these terms. Relevant changes create a new version, published with its date, and ask for new acceptance on your next visit. If you do not agree, you can delete your account.",
        },
      ],
    },
    {
      id: "lei",
      title: "10. Governing law and venue",
      blocks: [
        {
          p: "These terms follow the laws of Brazil. For consumers, the venue is the consumer's place of residence, as provided by the Consumer Defense Code. Otherwise, the venue of the controller's headquarters. For users in other countries, mandatory consumer and data protection rights of your country still apply.",
        },
      ],
    },
  ],
}

export const terms: Record<Locale, LegalContent> = { "pt-BR": pt, en }
