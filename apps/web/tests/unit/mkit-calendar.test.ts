import { describe, expect, it } from "vitest"
import { GET } from "@/app/mkit/calendario/route"
import { easterSunday, eventsFor, icsEscape, toIcs } from "@/lib/mkit-calendar"

describe("easterSunday", () => {
  it.each([
    [2024, 3, 31],
    [2025, 4, 20],
    [2026, 4, 5],
    [2027, 3, 28],
  ])("Páscoa de %d cai em %d/%d", (year, month, day) => {
    expect(easterSunday(year)).toEqual({ month, day })
  })
})

describe("eventsFor", () => {
  const byName = (year: number, name: string) => eventsFor(year).find((event) => event.name === name)?.date

  it("calcula as datas móveis de 2026", () => {
    expect(byName(2026, "Páscoa")).toBe("2026-04-05")
    expect(byName(2026, "Terça de Carnaval")).toBe("2026-02-17")
    expect(byName(2026, "Dia das Mães")).toBe("2026-05-10")
    expect(byName(2026, "Dia dos Pais")).toBe("2026-08-09")
    expect(byName(2026, "Black Friday")).toBe("2026-11-27")
  })

  it("mantém as datas fixas e devolve tudo em ordem", () => {
    expect(byName(2026, "Dia do Hambúrguer")).toBe("2026-05-28")
    expect(byName(2026, "Natal")).toBe("2026-12-25")
    const dates = eventsFor(2026).map((event) => event.date)
    expect(dates).toEqual([...dates].sort())
  })

  it("o Carnaval de 2027 cai em 9 de fevereiro", () => {
    expect(byName(2027, "Terça de Carnaval")).toBe("2027-02-09")
  })
})

describe("toIcs", () => {
  it("gera um calendário com eventos de dia inteiro e fim de linha CRLF", () => {
    const ics = toIcs([{ date: "2026-12-31", name: "Réveillon" }], "20260101T000000Z")
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true)
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true)
    expect(ics).toContain("DTSTART;VALUE=DATE:20261231\r\n")
    // Evento de dia inteiro termina no dia seguinte (fim exclusivo), inclusive na virada do ano.
    expect(ics).toContain("DTEND;VALUE=DATE:20270101\r\n")
    expect(ics).toContain("SUMMARY:Réveillon\r\n")
  })

  it("escapa caracteres especiais para não injetar propriedades", () => {
    expect(icsEscape("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne")
    const ics = toIcs([{ date: "2026-01-01", name: "Festa\r\nATTENDEE:mailto:x@y.z" }])
    expect(ics).not.toContain("\r\nATTENDEE:")
  })
})

describe("GET /mkit/calendario", () => {
  it("baixa o .ics do ano pedido", async () => {
    const response = GET(new Request("http://web.test/mkit/calendario?ano=2027"))
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("text/calendar")
    expect(response.headers.get("content-disposition")).toContain("mkit-2027.ics")
    expect(await response.text()).toContain("SUMMARY:Natal")
  })

  it("recusa ano inválido e usa o ano atual sem parâmetro", () => {
    expect(GET(new Request("http://web.test/mkit/calendario?ano=abc")).status).toBe(400)
    expect(GET(new Request("http://web.test/mkit/calendario?ano=1999")).status).toBe(400)
    expect(GET(new Request("http://web.test/mkit/calendario")).status).toBe(200)
  })
})
