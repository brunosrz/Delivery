// Calendário de datas comerciais para restaurantes (MKit). Datas fixas e móveis são calculadas, não digitadas:
// Páscoa pelo algoritmo gregoriano anônimo; as demais móveis a partir dela ou do dia da semana.

export type MkitEvent = { date: string; name: string }

const pad = (value: number) => String(value).padStart(2, "0")
const iso = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`

/** Domingo de Páscoa (calendário gregoriano). */
export function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { month, day }
}

/** N-ésimo dia da semana (0 = domingo) de um mês. */
function nthWeekday(year: number, month: number, weekday: number, nth: number): number {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  return 1 + ((weekday - first + 7) % 7) + (nth - 1) * 7
}

function addDays(year: number, month: number, day: number, delta: number): string {
  const date = new Date(Date.UTC(year, month - 1, day + delta))
  return iso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

export function eventsFor(year: number): MkitEvent[] {
  const easter = easterSunday(year)
  const events: MkitEvent[] = [
    { date: iso(year, 1, 1), name: "Ano Novo" },
    { date: addDays(year, easter.month, easter.day, -47), name: "Terça de Carnaval" },
    { date: iso(year, 3, 8), name: "Dia Internacional da Mulher" },
    { date: iso(year, easter.month, easter.day), name: "Páscoa" },
    { date: iso(year, 4, 24), name: "Dia do Café" },
    { date: iso(year, 5, nthWeekday(year, 5, 0, 2)), name: "Dia das Mães" },
    { date: iso(year, 5, 28), name: "Dia do Hambúrguer" },
    { date: iso(year, 6, 12), name: "Dia dos Namorados" },
    { date: iso(year, 7, 10), name: "Dia da Pizza" },
    { date: iso(year, 8, nthWeekday(year, 8, 0, 2)), name: "Dia dos Pais" },
    { date: iso(year, 9, 15), name: "Dia do Cliente" },
    { date: iso(year, 10, 12), name: "Dia das Crianças" },
    { date: iso(year, 10, 31), name: "Halloween" },
    { date: iso(year, 11, nthWeekday(year, 11, 5, 4)), name: "Black Friday" },
    { date: iso(year, 12, 25), name: "Natal" },
  ]
  return events.sort((a, b) => a.date.localeCompare(b.date))
}

/** Escapa texto para iCalendar (RFC 5545): barra, ponto e vírgula, vírgula e quebras de linha. */
export function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n")
}

/** Arquivo .ics com eventos de dia inteiro. `stamp` é injetado para o resultado ser determinístico. */
export function toIcs(events: readonly MkitEvent[], stamp = "20260101T000000Z"): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Delivery Express//MKit//PT-BR",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Calendário MKit",
  ]
  for (const event of events) {
    const compact = event.date.replaceAll("-", "")
    const end = new Date(`${event.date}T00:00:00Z`)
    end.setUTCDate(end.getUTCDate() + 1)
    lines.push(
      "BEGIN:VEVENT",
      `UID:mkit-${compact}-${event.name.replace(/[^A-Za-z0-9]/g, "")}@delivery-express`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact}`,
      `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replaceAll("-", "")}`,
      `SUMMARY:${icsEscape(event.name)}`,
      "END:VEVENT",
    )
  }
  lines.push("END:VCALENDAR")
  return `${lines.join("\r\n")}\r\n`
}
