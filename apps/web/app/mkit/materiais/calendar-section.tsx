"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { type CustomEvent, mergeCalendar, toIcs } from "@/lib/mkit-calendar"
import { callApi, mkitBase } from "./mkit-api"

const field = "mt-1 w-full rounded-md border px-3 py-2"

/** Calendário do ano: datas nacionais (calculadas) somadas às do restaurante, que dá para criar e remover. */
export function CalendarSection({ restaurantId }: { restaurantId: string }) {
  const url = `${mkitBase(restaurantId)}/calendar`
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [custom, setCustom] = useState<CustomEvent[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    const result = await callApi<CustomEvent[]>(url)
    if (result.ok) setCustom(result.data)
    else setMessage(result.message)
  }, [url])

  useEffect(() => {
    void load()
  }, [load])

  const entries = useMemo(() => mergeCalendar(year, custom), [year, custom])

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setMessage(null)
    const result = await callApi(url, {
      method: "POST",
      body: JSON.stringify({
        date: String(data.get("date") ?? ""),
        name: String(data.get("name") ?? ""),
        recurring: data.get("recurring") === "on",
      }),
    })
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    form.reset()
    await load()
  }

  async function remove(id: string) {
    setMessage(null)
    const result = await callApi(`${url}/${encodeURIComponent(id)}`, { method: "DELETE" })
    if (!result.ok) setMessage(result.message)
    else await load()
  }

  function download() {
    const blob = new Blob([toIcs(entries, `${year}0101T000000Z`)], { type: "text/calendar;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `mkit-${year}.ics`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <section aria-labelledby="calendario" className="mb-8 rounded-lg border p-4">
      <h2 id="calendario" className="mb-3 font-semibold">
        Calendário
      </h2>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-sm">
          Ano{" "}
          <input
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(event) => setYear(Number(event.target.value) || year)}
            className="w-24 rounded-md border px-2 py-1"
          />
        </label>
        <button type="button" onClick={download} className="rounded-md border px-3 py-1 text-sm">
          Baixar .ics
        </button>
      </div>
      <ul className="mb-4 max-h-64 space-y-1 overflow-y-auto text-sm">
        {entries.map((entry) => (
          <li
            key={`${entry.date}-${entry.name}-${entry.id ?? "n"}`}
            className="flex items-center justify-between gap-2"
          >
            <span>
              {entry.date.split("-").reverse().join("/")} · {entry.name}
              {entry.source === "custom" && <span className="ml-1 text-xs text-orange-700">(do restaurante)</span>}
            </span>
            {entry.id && (
              <button
                type="button"
                onClick={() => remove(entry.id as string)}
                className="text-xs text-red-700 underline"
              >
                Remover
              </button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="space-y-2 border-t pt-3">
        <p className="text-sm font-medium">Adicionar data do restaurante</p>
        <label className="block text-sm">
          Data
          <input name="date" type="date" required className={field} />
        </label>
        <label className="block text-sm">
          Nome
          <input name="name" required minLength={2} maxLength={80} className={field} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="recurring" type="checkbox" /> Repetir todo ano
        </label>
        <button type="submit" className="rounded-md border px-3 py-1 text-sm">
          Adicionar
        </button>
      </form>
      {message && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {message}
        </p>
      )}
    </section>
  )
}
