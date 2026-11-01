import { MkitMetrics, envelope } from "@delivery/contracts"
import { describe, expect, it } from "vitest"
import { call, newUser, postJson } from "./helpers"

const materials = (restaurantId: string) => `/v1/manage/restaurants/${restaurantId}/mkit/materials`
const metrics = (restaurantId: string, cookie?: string) =>
  call(`/v1/manage/restaurants/${restaurantId}/mkit/metrics`, { headers: cookie ? { cookie } : {} })

async function create(cookie: string, restaurantId: string, title: string, kind: string) {
  const response = await postJson(materials(restaurantId), { title, kind, body: `Texto de ${title}` }, { cookie })
  expect(response.status).toBe(201)
  return ((await response.json()) as { data: { id: string } }).data.id
}
const exportMaterial = async (cookie: string, restaurantId: string, id: string) =>
  expect((await call(`${materials(restaurantId)}/${id}/export`, { headers: { cookie } })).status).toBe(200)

describe("GET /v1/manage/restaurants/:id/mkit/metrics", () => {
  it("exige sessão e acesso ao restaurante", async () => {
    expect((await metrics("rest_pizzaria")).status).toBe(401)
    expect((await metrics("rest_pizzaria", (await newUser()).cookie)).status).toBe(403)
    const burger = await newUser({ staffOf: "rest_burger" })
    expect((await metrics("rest_pizzaria", burger.cookie)).status).toBe(403)
  })

  it("restaurante sem materiais devolve zeros", async () => {
    const staff = await newUser({ staffOf: "rest_pizzaria" })
    const { data } = envelope(MkitMetrics).parse(await (await metrics("rest_pizzaria", staff.cookie)).json())
    expect(data).toEqual({
      total: 0,
      published: 0,
      drafts: 0,
      totalExports: 0,
      byKind: { post: 0, cartaz: 0, promocao: 0 },
      top: [],
    })
  })

  it("soma materiais, status, tipos e exportações, e ordena os mais usados", async () => {
    const staff = await newUser({ staffOf: "rest_burger" })
    const post = await create(staff.cookie, "rest_burger", "Post de sexta", "post")
    const poster = await create(staff.cookie, "rest_burger", "Cartaz da vitrine", "cartaz")
    await create(staff.cookie, "rest_burger", "Promoção da semana", "promocao")
    const publish = await call(`${materials("rest_burger")}/${post}`, {
      method: "PATCH",
      headers: { cookie: staff.cookie, "content-type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    })
    expect(publish.status).toBe(200)
    await exportMaterial(staff.cookie, "rest_burger", poster)
    await exportMaterial(staff.cookie, "rest_burger", poster)
    await exportMaterial(staff.cookie, "rest_burger", post)

    const { data } = envelope(MkitMetrics).parse(await (await metrics("rest_burger", staff.cookie)).json())
    expect(data).toMatchObject({
      total: 3,
      published: 1,
      drafts: 2,
      totalExports: 3,
      byKind: { post: 1, cartaz: 1, promocao: 1 },
    })
    expect(data?.top.map((item) => [item.title, item.exportCount])).toEqual([
      ["Cartaz da vitrine", 2],
      ["Post de sexta", 1],
    ])
  })

  it("não mistura restaurantes", async () => {
    const burger = await newUser({ staffOf: "rest_burger" })
    const pizza = await newUser({ staffOf: "rest_pizzaria" })
    await create(burger.cookie, "rest_burger", "Só do burger", "post")
    const { data } = envelope(MkitMetrics).parse(await (await metrics("rest_pizzaria", pizza.cookie)).json())
    expect(data?.total).toBe(0)
  })
})
