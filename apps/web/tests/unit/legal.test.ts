import { LEGAL_VERSIONS } from "@delivery/contracts"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { COOKIE_REGISTRY, type LegalKind, getLegalDocument, legalVersion } from "@/lib/legal"
import { isPlausibleEmail, readController } from "@/lib/legal/config"
import { LOCALES } from "@/lib/locale"

const KINDS: LegalKind[] = ["terms", "privacy", "cookies"]

describe("documentos legais", () => {
  it.each(KINDS)("%s: mesmas seções, na mesma ordem, em todos os idiomas", (kind) => {
    const ids = LOCALES.map((locale) => getLegalDocument(kind, locale).sections.map((section) => section.id))
    for (const list of ids) expect(list).toEqual(ids[0])
  })

  it.each(KINDS)("%s: mesmo formato de bloco e de tabela em cada seção", (kind) => {
    const shape = (locale: (typeof LOCALES)[number]) =>
      getLegalDocument(kind, locale).sections.map((section) =>
        section.blocks.map((block) =>
          "table" in block
            ? `table:${block.table.head.length}x${block.table.rows.length}`
            : "ul" in block
              ? `ul:${block.ul.length}`
              : "p",
        ),
      )
    for (const locale of LOCALES) expect(shape(locale)).toEqual(shape(LOCALES[0] as (typeof LOCALES)[number]))
  })

  it.each(KINDS)("%s: título, introdução e seções não vazios", (kind) => {
    for (const locale of LOCALES) {
      const document = getLegalDocument(kind, locale)
      expect(document.title.length).toBeGreaterThan(3)
      expect(document.intro.length).toBeGreaterThan(40)
      for (const section of document.sections) {
        expect(section.title.length, section.id).toBeGreaterThan(2)
        expect(section.blocks.length, section.id).toBeGreaterThan(0)
      }
    }
  })

  it("a política de privacidade cobre LGPD, GDPR e CCPA nos dois idiomas", () => {
    const text = (locale: (typeof LOCALES)[number]) => JSON.stringify(getLegalDocument("privacy", locale))
    for (const locale of LOCALES) {
      expect(text(locale), locale).toContain("LGPD")
      expect(text(locale), locale).toContain("GDPR")
      expect(text(locale), locale).toContain("CCPA")
      expect(text(locale), locale).toContain("Global Privacy Control")
      expect(text(locale), locale).toContain("ANPD")
    }
    const ids = getLegalDocument("privacy", "en").sections.map((section) => section.id)
    expect(ids).toEqual(
      expect.arrayContaining(["controlador", "bases", "retencao", "direitos", "gdpr", "eua", "seguranca"]),
    )
  })

  it("os prazos de retenção do texto são os do código do Worker", () => {
    const workerSource = readFileSync("../casa-das-maquinas/src/retention.ts", "utf8")
    expect(workerSource).toContain("contactMessages: 365")
    expect(workerSource).toContain("consentRecords: 5 * 365")
    expect(workerSource).toContain("dataRequests: 5 * 365")
    const pt = JSON.stringify(getLegalDocument("privacy", "pt-BR"))
    expect(pt).toContain("12 meses")
    expect(pt).toContain("5 anos")
    expect(pt).toContain("24 horas")
  })

  it("cada documento tem versão vigente do contrato", () => {
    expect(legalVersion("terms")).toBe(LEGAL_VERSIONS.terms)
    expect(legalVersion("privacy")).toBe(LEGAL_VERSIONS.privacy)
    expect(legalVersion("cookies")).toBe(LEGAL_VERSIONS.privacy)
  })
})

describe("política de cookies e o que o código realmente grava", () => {
  it("todo cookie do registro aparece na página, nos dois idiomas", () => {
    for (const locale of LOCALES) {
      const text = JSON.stringify(getLegalDocument("cookies", locale))
      for (const cookie of COOKIE_REGISTRY) expect(text, `${locale}:${cookie.name}`).toContain(cookie.name)
    }
  })

  it("nenhum cookie novo é gravado sem estar no registro", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((entry) => {
        if (["node_modules", ".next", "paraglide", "tests", "coverage"].includes(entry)) return []
        const path = join(dir, entry)
        return statSync(path).isDirectory() ? walk(path) : /\.(ts|tsx)$/.test(path) ? [path] : []
      })
    const writers = ["app", "components", "lib"]
      .flatMap(walk)
      .filter((file) => /document\.cookie\s*=|cookies\(\)\)?\.set\(|\.cookies\.set\(/.test(readFileSync(file, "utf8")))
      .map((file) => file.replaceAll("\\", "/"))
      .sort()
    // Só o idioma (locale-switcher) e a escolha de cookies (consent-manager); o login é do Better Auth, no Worker.
    expect(writers).toEqual(["components/privacy/consent-manager.tsx", "components/privacy/locale-switcher.tsx"])
    expect(COOKIE_REGISTRY.map((cookie) => cookie.name).sort()).toEqual([
      "PARAGLIDE_LOCALE",
      "better-auth.session_token",
      "consent",
    ])
    expect(COOKIE_REGISTRY.every((cookie) => cookie.category === "necessary")).toBe(true)
  })

  it("scripts de terceiros não são carregados (nada para pedir consentimento hoje)", () => {
    const layout = readFileSync("app/layout.tsx", "utf8")
    expect(layout).not.toMatch(/googletagmanager|google-analytics|gtag|facebook|fbq|hotjar|clarity\.ms/i)
    expect(layout).not.toMatch(/<Script\b/)
  })
})

describe("controlador", () => {
  it("lê do ambiente e trata vazio como ausente", () => {
    expect(readController({})).toEqual({ name: null, taxId: null, privacyEmail: null })
    expect(
      readController({
        NEXT_PUBLIC_CONTROLLER_NAME: "  Delivery Ltda  ",
        NEXT_PUBLIC_CONTROLLER_TAX_ID: "",
        NEXT_PUBLIC_PRIVACY_EMAIL: "privacidade@exemplo.com.br",
      }),
    ).toEqual({ name: "Delivery Ltda", taxId: null, privacyEmail: "privacidade@exemplo.com.br" })
  })

  it("só aceita e-mail com formato simples (o link mailto não leva texto estranho)", () => {
    expect(isPlausibleEmail("a@b.co")).toBe(true)
    for (const bad of [
      null,
      "",
      "sem-arroba",
      "a@b",
      "a b@c.de",
      'a@b.de"onmouseover="x',
      "<x>@b.de",
      "a@b.de, c@d.ef",
    ]) {
      expect(isPlausibleEmail(bad), String(bad)).toBe(false)
    }
  })
})

describe("mensagens traduzidas", () => {
  it("todas as chaves existem nos dois idiomas, com os mesmos parâmetros", () => {
    const load = (locale: string) =>
      JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, string>
    const [pt, en] = [load("pt-BR"), load("en")]
    const keys = (messages: Record<string, string>) =>
      Object.keys(messages)
        .filter((key) => !key.startsWith("$"))
        .sort()
    expect(keys(en)).toEqual(keys(pt))
    const params = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
    for (const key of keys(pt)) {
      expect(params(en[key] ?? ""), key).toEqual(params(pt[key] ?? ""))
      expect((pt[key] ?? "").trim().length, `pt:${key}`).toBeGreaterThan(0)
      expect((en[key] ?? "").trim().length, `en:${key}`).toBeGreaterThan(0)
    }
  })
})
