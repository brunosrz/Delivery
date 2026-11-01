import { describe, expect, it } from "vitest"
import { DEFAULT_LOCALE, LOCALES, isSupportedLocale, localeCookie, resolveLocale } from "@/lib/locale"

describe("resolveLocale", () => {
  it("o cookie escolhido pela pessoa vence o navegador", () => {
    expect(resolveLocale("en", "pt-BR,pt;q=0.9")).toBe("en")
    expect(resolveLocale("pt-BR", "en-US,en;q=0.9")).toBe("pt-BR")
  })

  it("cookie inválido é ignorado", () => {
    expect(resolveLocale("fr", "en-US")).toBe("en")
    expect(resolveLocale("<script>", undefined)).toBe(DEFAULT_LOCALE)
  })

  it("segue a ordem de preferência do Accept-Language", () => {
    expect(resolveLocale(undefined, "fr;q=0.9, en;q=0.8, pt-BR;q=0.7")).toBe("en")
    expect(resolveLocale(undefined, "pt;q=0.4, en;q=0.9")).toBe("en")
  })

  it("aceita variantes regionais e só o idioma", () => {
    expect(resolveLocale(undefined, "en-GB")).toBe("en")
    expect(resolveLocale(undefined, "pt")).toBe("pt-BR")
    expect(resolveLocale(undefined, "pt-PT")).toBe("pt-BR")
    expect(resolveLocale(undefined, "EN-us")).toBe("en")
  })

  it("sem idioma suportado ou sem cabeçalho, usa o padrão", () => {
    expect(resolveLocale(undefined, "de, fr;q=0.8")).toBe(DEFAULT_LOCALE)
    expect(resolveLocale(undefined, "*")).toBe(DEFAULT_LOCALE)
    expect(resolveLocale(undefined, "en;q=0")).toBe(DEFAULT_LOCALE)
    expect(resolveLocale(undefined, null)).toBe(DEFAULT_LOCALE)
    expect(resolveLocale(undefined, "")).toBe(DEFAULT_LOCALE)
  })

  it("q inválido não derruba a escolha", () => {
    expect(resolveLocale(undefined, "en;q=abc, pt-BR;q=0.5")).toBe("pt-BR")
  })
})

describe("locales e cookie de idioma", () => {
  it("o padrão é pt-BR e há inglês", () => {
    expect(DEFAULT_LOCALE).toBe("pt-BR")
    expect(LOCALES).toEqual(["pt-BR", "en"])
    expect(isSupportedLocale("en")).toBe(true)
    expect(isSupportedLocale("es")).toBe(false)
    expect(isSupportedLocale(undefined)).toBe(false)
  })

  it("o cookie tem SameSite e Secure só em HTTPS", () => {
    expect(localeCookie("en", false)).toMatch(/^PARAGLIDE_LOCALE=en; Path=\/; Max-Age=\d+; SameSite=Lax$/)
    expect(localeCookie("pt-BR", true)).toMatch(/; SameSite=Lax; Secure$/)
  })
})
