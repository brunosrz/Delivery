// Cliente mínimo da API v3 do Asaas (https://docs.asaas.com). Só o que o checkout usa: cliente, cobrança e QR Code Pix.
// Nenhum dado de cartão passa por aqui: cartão (crédito e débito) usa a fatura hospedada (`invoiceUrl`).

const BASE_URL = {
  sandbox: "https://api-sandbox.asaas.com/v3",
  production: "https://api.asaas.com/v3",
} as const

/** O Asaas exige User-Agent em contas raiz criadas a partir de 13/06/2024. */
const USER_AGENT = "delivery-casa-das-maquinas"
const TIMEOUT_MS = 8000

export type AsaasBillingType = "PIX" | "CREDIT_CARD"

export type AsaasPayment = {
  id: string
  status: string
  invoiceUrl: string | null
  externalReference: string | null
  value: number
  billingType: string
}

export type AsaasPixQrCode = { payload: string; encodedImage: string; expirationDate: string | null }

/** `rate_limited` não deve ser repetido na hora (a doc do Asaas pede intervalos progressivos). */
/**
 * O Asaas devolve datas como "2026-12-31 23:59:59" (horário de Brasília, sem fuso). O contrato da API usa ISO 8601
 * com fuso; um valor que não reconhecemos vira null em vez de quebrar a resposta do pedido.
 */
export function asaasDateTimeToIso(value: string | null | undefined): string | null {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return value
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/.exec(value)
  return match ? `${match[1]}T${match[2]}-03:00` : null
}

export type AsaasErrorKind = "unavailable" | "rate_limited" | "rejected" | "unauthorized"

export class AsaasError extends Error {
  constructor(
    readonly kind: AsaasErrorKind,
    message: string,
    readonly status = 0,
  ) {
    super(message)
    this.name = "AsaasError"
  }
}

export type AsaasConfig = { apiKey: string; environment: "sandbox" | "production"; fetch?: typeof fetch }

export function asaasConfigFrom(env: Env): AsaasConfig | null {
  const apiKey = env.ASAAS_API_KEY
  if (!apiKey) return null
  return { apiKey, environment: env.ASAAS_ENV === "production" ? "production" : "sandbox" }
}

export function createAsaasClient(config: AsaasConfig) {
  const baseUrl = BASE_URL[config.environment]
  const doFetch = config.fetch ?? fetch

  async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    let response: Response
    try {
      response = await doFetch(`${baseUrl}${path}`, {
        method,
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          access_token: config.apiKey,
          "user-agent": USER_AGENT,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch {
      throw new AsaasError("unavailable", "Asaas indisponível")
    }

    if (response.status === 429) throw new AsaasError("rate_limited", "limite de requisições do Asaas", 429)
    if (response.status === 401 || response.status === 403) {
      // 401 também ocorre ao usar a chave de produção no sandbox (ou o inverso).
      throw new AsaasError("unauthorized", "chave do Asaas recusada", response.status)
    }
    if (response.status >= 500) throw new AsaasError("unavailable", "Asaas indisponível", response.status)
    if (!response.ok) {
      // Só o código e o primeiro erro de negócio; nada do corpo enviado (dados do pagador).
      const detail = (await response.json().catch(() => null)) as { errors?: { code?: string }[] } | null
      throw new AsaasError(
        "rejected",
        `Asaas recusou a requisição (${detail?.errors?.[0]?.code ?? "sem código"})`,
        response.status,
      )
    }
    return (await response.json()) as T
  }

  return {
    /** O Asaas permite clientes duplicados; quem chama guarda o `cus_…` e só cria quando não há um. */
    createCustomer(input: {
      name: string
      cpfCnpj: string
      email?: string
      mobilePhone?: string
      externalReference: string
    }) {
      return call<{ id: string }>("POST", "/customers", { ...input, notificationDisabled: true })
    },

    /** Sem Idempotency-Key no Asaas: procure pela referência externa antes de criar. */
    async findPaymentByReference(externalReference: string): Promise<AsaasPayment | null> {
      const page = await call<{ data: AsaasPayment[] }>(
        "GET",
        `/payments?externalReference=${encodeURIComponent(externalReference)}&limit=1`,
      )
      return page.data[0] ?? null
    },

    createPayment(input: {
      customer: string
      billingType: AsaasBillingType
      /** Em reais (a API usa decimal), calculado a partir dos centavos. */
      value: number
      dueDate: string
      externalReference: string
      description: string
    }) {
      return call<AsaasPayment>("POST", "/payments", input)
    },

    getPixQrCode(paymentId: string) {
      return call<AsaasPixQrCode>("GET", `/payments/${encodeURIComponent(paymentId)}/pixQrCode`)
    },
  }
}

export type AsaasClient = ReturnType<typeof createAsaasClient>
