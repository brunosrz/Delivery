import { eventsFor, toIcs } from "@/lib/mkit-calendar"

/** Baixa o calendário comercial do ano em .ics. `?ano=2027` (2000 a 2100); sem o parâmetro usa o ano atual. */
export function GET(request: Request) {
  const param = new URL(request.url).searchParams.get("ano")
  const year = param === null ? new Date().getUTCFullYear() : Number(param)
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return Response.json({ message: "ano inválido (use de 2000 a 2100)" }, { status: 400 })
  }
  return new Response(toIcs(eventsFor(year), `${year}0101T000000Z`), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="mkit-${year}.ics"`,
      "cache-control": "public, max-age=86400",
    },
  })
}
