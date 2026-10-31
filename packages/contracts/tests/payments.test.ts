import { describe, expect, it } from "vitest"
import { Charge, ONLINE_PAYMENT_METHODS, Payer, PaymentMethod, isOnlinePayment } from "../src/index.js"

describe("métodos de pagamento", () => {
  it("só pix e card são cobrados online", () => {
    expect([...ONLINE_PAYMENT_METHODS]).toEqual(["pix", "card"])
    for (const method of PaymentMethod.options) {
      expect(isOnlinePayment(method)).toBe(method === "pix" || method === "card")
    }
  })
})

describe("Payer", () => {
  it("normaliza CPF e telefone para dígitos", () => {
    const payer = Payer.parse({ name: "Maria da Silva", cpfCnpj: "249.715.637-92", mobilePhone: "(32) 99999-0000" })
    expect(payer).toMatchObject({ cpfCnpj: "24971563792", mobilePhone: "32999990000" })
  })

  it("aceita CNPJ e recusa documento com tamanho inválido", () => {
    expect(Payer.safeParse({ name: "Loja Ltda", cpfCnpj: "12.345.678/0001-95" }).success).toBe(true)
    expect(Payer.safeParse({ name: "Maria", cpfCnpj: "123" }).success).toBe(false)
  })

  it("recusa telefone inválido e campos extras (dados de cartão não existem no contrato)", () => {
    expect(Payer.safeParse({ name: "Maria", cpfCnpj: "24971563792", mobilePhone: "12" }).success).toBe(false)
    expect(Payer.safeParse({ name: "Maria", cpfCnpj: "24971563792", cardNumber: "4444" }).success).toBe(false)
  })
})

describe("Charge", () => {
  it("aceita Pix com QR Code e cartão com fatura", () => {
    expect(
      Charge.safeParse({
        provider: "asaas",
        chargeId: "pay_1",
        invoiceUrl: null,
        pix: { payload: "000201", qrCodeImage: "iVBOR", expiresAt: null },
      }).success,
    ).toBe(true)
    expect(
      Charge.safeParse({ provider: "asaas", chargeId: "pay_2", invoiceUrl: "https://www.asaas.com/i/2", pix: null })
        .success,
    ).toBe(true)
  })

  it("recusa outro provedor", () => {
    expect(Charge.safeParse({ provider: "stripe", chargeId: "x", invoiceUrl: null, pix: null }).success).toBe(false)
  })
})
