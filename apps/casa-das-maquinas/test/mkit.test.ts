import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { call, newUser, postJson } from "./helpers"

const base = (restaurantId: string) => `/v1/manage/restaurants/${restaurantId}/mkit/materials`
const send = (method: string, path: string, cookie: string, body?: unknown) =>
  call(path, {
    method,
    headers: { cookie, ...(body ? { "content-type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
type Material = { id: string; title: string; body: string; status: string; exportCount: number; restaurantId: string }
const data = async <T>(response: Response) => ((await response.json()) as { data: T }).data

describe("MKit: materiais do restaurante", () => {
  it("a equipe cria, lista, atualiza, exporta e remove materiais do próprio restaurante", async () => {
    const staff = await newUser({ staffOf: "rest_burger" })

    const created = await postJson(
      base("rest_burger"),
      { title: "Promo da <b>semana</b>", kind: "promocao", body: "2 burgers por R$ 49,90<script>alert(1)</script>" },
      { cookie: staff.cookie },
    )
    expect(created.status).toBe(201)
    const material = await data<Material>(created)
    // O texto é limpo antes de gravar.
    expect(material).toMatchObject({
      title: "Promo da semana",
      body: "2 burgers por R$ 49,90",
      status: "draft",
      exportCount: 0,
      restaurantId: "rest_burger",
    })

    const listed = await data<Material[]>(await send("GET", base("rest_burger"), staff.cookie))
    expect(listed.map((item) => item.id)).toContain(material.id)

    const published = await send("PATCH", `${base("rest_burger")}/${material.id}`, staff.cookie, {
      status: "published",
    })
    expect(published.status).toBe(200)
    expect((await data<Material>(published)).status).toBe("published")

    const exported = await send("GET", `${base("rest_burger")}/${material.id}/export`, staff.cookie)
    expect(exported.status).toBe(200)
    expect(exported.headers.get("content-type")).toContain("text/plain")
    expect(exported.headers.get("content-disposition")).toContain("promo-da-semana.txt")
    expect(exported.headers.get("x-content-type-options")).toBe("nosniff")
    expect(await exported.text()).toBe("Promo da semana\n\n2 burgers por R$ 49,90\n")

    // Métrica de uso: a exportação contou.
    const again = await data<Material[]>(await send("GET", base("rest_burger"), staff.cookie))
    expect(again.find((item) => item.id === material.id)?.exportCount).toBe(1)

    expect((await send("DELETE", `${base("rest_burger")}/${material.id}`, staff.cookie)).status).toBe(200)
    expect((await send("GET", `${base("rest_burger")}/${material.id}/export`, staff.cookie)).status).toBe(404)
  })

  it("isola os restaurantes: a equipe de um não acessa o MKit do outro", async () => {
    const burger = await newUser({ staffOf: "rest_burger" })
    const pizza = await newUser({ staffOf: "rest_pizzaria" })
    const mine = await data<Material>(
      await postJson(
        base("rest_burger"),
        { title: "Cartaz", kind: "cartaz", body: "Texto do cartaz" },
        { cookie: burger.cookie },
      ),
    )

    expect((await send("GET", base("rest_burger"), pizza.cookie)).status).toBe(403)
    expect(
      (await postJson(base("rest_burger"), { title: "Invasão", kind: "post", body: "x" }, { cookie: pizza.cookie }))
        .status,
    ).toBe(403)
    expect((await send("PATCH", `${base("rest_burger")}/${mine.id}`, pizza.cookie, { title: "Hack" })).status).toBe(403)
    expect((await send("DELETE", `${base("rest_burger")}/${mine.id}`, pizza.cookie)).status).toBe(403)
    expect((await send("GET", `${base("rest_burger")}/${mine.id}/export`, pizza.cookie)).status).toBe(403)

    // Mesmo com acesso ao próprio restaurante, o id de outro restaurante na URL não vaza o material.
    expect((await send("GET", `${base("rest_pizzaria")}/${mine.id}/export`, pizza.cookie)).status).toBe(404)
  })

  it("exige sessão e papel de equipe; cliente e entregador não gerenciam materiais", async () => {
    expect((await call(base("rest_burger"))).status).toBe(401)
    const customer = await newUser()
    const courier = await newUser("courier")
    expect((await send("GET", base("rest_burger"), customer.cookie)).status).toBe(403)
    expect((await send("GET", base("rest_burger"), courier.cookie)).status).toBe(403)
  })

  it("valida o conteúdo: vazio depois da limpeza, tipo inválido e campos extras", async () => {
    const staff = await newUser({ staffOf: "rest_burger" })
    const post = (body: unknown) => postJson(base("rest_burger"), body, { cookie: staff.cookie })
    expect((await post({ title: "Ok", kind: "post", body: "<script>x</script>" })).status).toBe(400)
    expect((await post({ title: "Ok", kind: "banner", body: "texto" })).status).toBe(400)
    expect((await post({ title: "Ok", kind: "post", body: "texto", restaurantId: "rest_pizzaria" })).status).toBe(400)
    expect((await send("PATCH", `${base("rest_burger")}/qualquer`, staff.cookie, {})).status).toBe(400)
  })

  it("não grava HTML mesmo que o corpo passe direto para o banco sem o schema", async () => {
    const staff = await newUser({ staffOf: "rest_burger" })
    const { createMkitService } = await import("../src/mkit")
    const user = {
      id: "u",
      email: "e@x.test",
      name: "n",
      role: "restaurant_staff" as const,
      restaurantIds: ["rest_burger"],
    }
    const result = await createMkitService(env).create(user, "rest_burger", {
      title: "<i>Título</i>",
      kind: "post",
      body: "<img src=x onerror=alert(1)>Corpo",
    })
    expect(result.ok && result.value).toMatchObject({ title: "Título", body: "Corpo" })
    void staff
  })
})
