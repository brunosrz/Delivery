import { MkitCalendarEvent, MkitCategory, MkitMaterial, envelope } from "@delivery/contracts"
import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { discounted, formatBrl } from "../src/mkit-templates"
import { RETENTION_DAYS, purgeExpired } from "../src/retention"
import { call, newUser } from "./helpers"

const base = (restaurantId: string) => `/v1/manage/restaurants/${restaurantId}/mkit`
const send = (method: string, path: string, cookie?: string, body?: unknown) =>
  call(path, {
    method,
    headers: { ...(cookie ? { cookie } : {}), ...(body === undefined ? {} : { "content-type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
const material = envelope(MkitMaterial)
const staffOf = (restaurantId: string) => newUser({ staffOf: restaurantId })

async function createMaterial(cookie: string, restaurantId: string, extra: Record<string, unknown> = {}) {
  const response = await send("POST", `${base(restaurantId)}/materials`, cookie, {
    title: "Post de teste",
    kind: "post",
    body: "Texto do post",
    ...extra,
  })
  expect(response.status).toBe(201)
  return material.parse(await response.json()).data as MkitMaterial
}
const listMaterials = async (cookie: string, restaurantId: string, trash = false) =>
  envelope(z.array(MkitMaterial)).parse(
    await (await send("GET", `${base(restaurantId)}/materials${trash ? "?lixeira=1" : ""}`, cookie)).json(),
  ).data ?? []

describe("permissões por restaurante nas rotas novas", () => {
  const rest = "rest_burger"
  const routes: [string, string, unknown?][] = [
    ["GET", `${base(rest)}/categories`],
    ["POST", `${base(rest)}/categories`, { name: "Minha categoria" }],
    ["DELETE", `${base(rest)}/categories/qualquer`],
    ["GET", `${base(rest)}/calendar`],
    ["POST", `${base(rest)}/calendar`, { date: "2026-12-01", name: "Aniversário" }],
    ["DELETE", `${base(rest)}/calendar/qualquer`],
    ["POST", `${base(rest)}/materials/generate`, { template: "data", eventName: "Natal" }],
    ["POST", `${base(rest)}/materials/qualquer/restore`],
    ["GET", `${base(rest)}/materials?lixeira=1`],
    ["DELETE", `${base(rest)}/materials/qualquer?definitivo=1`],
  ]

  it("exigem sessão", async () => {
    for (const [method, path, body] of routes) {
      expect((await send(method, path, undefined, body)).status, `${method} ${path}`).toBe(401)
    }
  })

  it("recusam cliente e equipe de outro restaurante", async () => {
    const customer = await newUser()
    const pizza = await staffOf("rest_pizzaria")
    for (const [method, path, body] of routes) {
      expect((await send(method, path, customer.cookie, body)).status, `cliente ${method} ${path}`).toBe(403)
      expect((await send(method, path, pizza.cookie, body)).status, `pizzaria ${method} ${path}`).toBe(403)
    }
  })
})

describe("categorias", () => {
  const list = async (cookie: string, restaurantId: string) =>
    envelope(z.array(MkitCategory)).parse(await (await send("GET", `${base(restaurantId)}/categories`, cookie)).json())
      .data ?? []

  it("traz as categorias da plataforma e as próprias, sem mostrar as de outro restaurante", async () => {
    const burger = await staffOf("rest_burger")
    const pizza = await staffOf("rest_pizzaria")
    const platform = (await list(burger.cookie, "rest_burger")).filter((item) => item.scope === "platform")
    expect(platform.map((item) => item.name)).toEqual([
      "Cardápio e novidades",
      "Datas comemorativas",
      "Institucional",
      "Promoções",
      "Redes sociais",
    ])

    const created = await send("POST", `${base("rest_burger")}/categories`, burger.cookie, { name: "Happy hour" })
    expect(created.status).toBe(201)
    expect((await list(burger.cookie, "rest_burger")).map((item) => item.name)).toContain("Happy hour")
    expect((await list(pizza.cookie, "rest_pizzaria")).map((item) => item.name)).not.toContain("Happy hour")
  })

  it("recusa nome repetido (sem diferenciar maiúsculas), inclusive igual ao da plataforma", async () => {
    const staff = await staffOf("rest_burger")
    expect((await send("POST", `${base("rest_burger")}/categories`, staff.cookie, { name: "Brunch" })).status).toBe(201)
    expect((await send("POST", `${base("rest_burger")}/categories`, staff.cookie, { name: "brunch" })).status).toBe(409)
    expect((await send("POST", `${base("rest_burger")}/categories`, staff.cookie, { name: "PROMOÇÕES" })).status).toBe(
      409,
    )
  })

  it("valida e limpa o nome", async () => {
    const staff = await staffOf("rest_burger")
    expect((await send("POST", `${base("rest_burger")}/categories`, staff.cookie, { name: "x" })).status).toBe(400)
    expect(
      (await send("POST", `${base("rest_burger")}/categories`, staff.cookie, { name: "Ok", extra: 1 })).status,
    ).toBe(400)
    const response = await send("POST", `${base("rest_burger")}/categories`, staff.cookie, { name: "<b>Sazonal</b>" })
    expect(((await response.json()) as { data: { name: string } }).data.name).toBe("Sazonal")
  })

  it("remover a categoria deixa os materiais sem categoria; a da plataforma não sai", async () => {
    const staff = await staffOf("rest_burger")
    const created = await send("POST", `${base("rest_burger")}/categories`, staff.cookie, { name: "Temporária" })
    const category = envelope(MkitCategory).parse(await created.json()).data as MkitCategory
    const item = await createMaterial(staff.cookie, "rest_burger", { categoryId: category.id })
    expect(item.categoryId).toBe(category.id)

    expect((await send("DELETE", `${base("rest_burger")}/categories/${category.id}`, staff.cookie)).status).toBe(200)
    expect(
      (await listMaterials(staff.cookie, "rest_burger")).find((entry) => entry.id === item.id)?.categoryId,
    ).toBeNull()

    expect((await send("DELETE", `${base("rest_burger")}/categories/cat_promocoes`, staff.cookie)).status).toBe(403)
    expect((await send("DELETE", `${base("rest_burger")}/categories/nao-existe`, staff.cookie)).status).toBe(404)
  })

  it("não remove nem usa categoria de outro restaurante", async () => {
    const burger = await staffOf("rest_burger")
    const pizza = await staffOf("rest_pizzaria")
    const created = await send("POST", `${base("rest_pizzaria")}/categories`, pizza.cookie, { name: "Só da pizzaria" })
    const category = envelope(MkitCategory).parse(await created.json()).data as MkitCategory

    expect((await send("DELETE", `${base("rest_burger")}/categories/${category.id}`, burger.cookie)).status).toBe(404)
    const stolen = await send("POST", `${base("rest_burger")}/materials`, burger.cookie, {
      title: "Roubada",
      kind: "post",
      body: "x",
      categoryId: category.id,
    })
    expect(stolen.status).toBe(400)
  })
})

describe("materiais: meio, categoria e dados incompletos", () => {
  it("sem informar nada além do essencial, o material é digital e sem categoria", async () => {
    const staff = await staffOf("rest_burger")
    const item = await createMaterial(staff.cookie, "rest_burger")
    expect(item).toMatchObject({
      medium: "digital",
      categoryId: null,
      deletedAt: null,
      status: "draft",
      exportCount: 0,
    })
  })

  it("aceita material físico com categoria da plataforma e permite mudar e limpar depois", async () => {
    const staff = await staffOf("rest_burger")
    const item = await createMaterial(staff.cookie, "rest_burger", {
      kind: "cartaz",
      medium: "fisico",
      categoryId: "cat_promocoes",
    })
    expect(item).toMatchObject({ medium: "fisico", categoryId: "cat_promocoes" })

    const changed = await send("PATCH", `${base("rest_burger")}/materials/${item.id}`, staff.cookie, {
      medium: "digital",
      categoryId: null,
    })
    expect(material.parse(await changed.json()).data).toMatchObject({ medium: "digital", categoryId: null })
  })

  it("atualização parcial mantém o resto; corpo vazio e meio inválido são recusados", async () => {
    const staff = await staffOf("rest_burger")
    const item = await createMaterial(staff.cookie, "rest_burger", { medium: "fisico" })
    const updated = await send("PATCH", `${base("rest_burger")}/materials/${item.id}`, staff.cookie, {
      status: "published",
    })
    expect(material.parse(await updated.json()).data).toMatchObject({
      status: "published",
      medium: "fisico",
      title: item.title,
    })
    expect((await send("PATCH", `${base("rest_burger")}/materials/${item.id}`, staff.cookie, {})).status).toBe(400)
    expect(
      (await send("PATCH", `${base("rest_burger")}/materials/${item.id}`, staff.cookie, { medium: "holograma" }))
        .status,
    ).toBe(400)
    expect(
      (
        await send("POST", `${base("rest_burger")}/materials`, staff.cookie, {
          title: "Ok",
          kind: "post",
          body: "x",
          medium: "x",
        })
      ).status,
    ).toBe(400)
  })

  it("categoria inexistente é recusada na criação e na atualização", async () => {
    const staff = await staffOf("rest_burger")
    expect(
      (
        await send("POST", `${base("rest_burger")}/materials`, staff.cookie, {
          title: "Ok",
          kind: "post",
          body: "x",
          categoryId: "nao-existe",
        })
      ).status,
    ).toBe(400)
    const item = await createMaterial(staff.cookie, "rest_burger")
    expect(
      (await send("PATCH", `${base("rest_burger")}/materials/${item.id}`, staff.cookie, { categoryId: "nao-existe" }))
        .status,
    ).toBe(400)
  })
})

describe("lixeira e restauração", () => {
  it("excluir manda para a lixeira; restaurar devolve com tudo no lugar", async () => {
    const staff = await staffOf("rest_burger")
    const item = await createMaterial(staff.cookie, "rest_burger", { medium: "fisico", categoryId: "cat_cardapio" })
    await send("PATCH", `${base("rest_burger")}/materials/${item.id}`, staff.cookie, { status: "published" })

    expect((await send("DELETE", `${base("rest_burger")}/materials/${item.id}`, staff.cookie)).status).toBe(200)
    expect((await listMaterials(staff.cookie, "rest_burger")).map((entry) => entry.id)).not.toContain(item.id)
    const trash = await listMaterials(staff.cookie, "rest_burger", true)
    expect(trash.find((entry) => entry.id === item.id)?.deletedAt).toBeTruthy()

    const restored = await send("POST", `${base("rest_burger")}/materials/${item.id}/restore`, staff.cookie)
    expect(restored.status).toBe(200)
    expect(material.parse(await restored.json()).data).toMatchObject({
      id: item.id,
      deletedAt: null,
      status: "published",
      medium: "fisico",
      categoryId: "cat_cardapio",
    })
    expect((await listMaterials(staff.cookie, "rest_burger")).map((entry) => entry.id)).toContain(item.id)
    expect((await listMaterials(staff.cookie, "rest_burger", true)).map((entry) => entry.id)).not.toContain(item.id)
  })

  it("item na lixeira não edita, não exporta e não conta nas métricas; restaurar o que não está na lixeira dá 404", async () => {
    const staff = await staffOf("rest_burger")
    const item = await createMaterial(staff.cookie, "rest_burger")
    expect((await send("POST", `${base("rest_burger")}/materials/${item.id}/restore`, staff.cookie)).status).toBe(404)

    await send("DELETE", `${base("rest_burger")}/materials/${item.id}`, staff.cookie)
    expect(
      (await send("PATCH", `${base("rest_burger")}/materials/${item.id}`, staff.cookie, { title: "Novo título" }))
        .status,
    ).toBe(404)
    expect((await send("GET", `${base("rest_burger")}/materials/${item.id}/export`, staff.cookie)).status).toBe(404)
    expect((await send("DELETE", `${base("rest_burger")}/materials/${item.id}`, staff.cookie)).status).toBe(404)

    const metrics = (await (await send("GET", `${base("rest_burger")}/metrics`, staff.cookie)).json()) as {
      data: { trashed: number; total: number }
    }
    expect(metrics.data.trashed).toBeGreaterThanOrEqual(1)
    const active = (await listMaterials(staff.cookie, "rest_burger")).length
    expect(metrics.data.total).toBe(active)
  })

  it("exclusão definitiva só vale para quem está na lixeira", async () => {
    const staff = await staffOf("rest_burger")
    const item = await createMaterial(staff.cookie, "rest_burger")
    expect(
      (await send("DELETE", `${base("rest_burger")}/materials/${item.id}?definitivo=1`, staff.cookie)).status,
    ).toBe(409)

    await send("DELETE", `${base("rest_burger")}/materials/${item.id}`, staff.cookie)
    expect(
      (await send("DELETE", `${base("rest_burger")}/materials/${item.id}?definitivo=1`, staff.cookie)).status,
    ).toBe(200)
    expect((await listMaterials(staff.cookie, "rest_burger", true)).map((entry) => entry.id)).not.toContain(item.id)
    expect(
      (await send("DELETE", `${base("rest_burger")}/materials/${item.id}?definitivo=1`, staff.cookie)).status,
    ).toBe(404)
  })

  it("a lixeira de um restaurante não aparece nem restaura em outro", async () => {
    const burger = await staffOf("rest_burger")
    const pizza = await staffOf("rest_pizzaria")
    const item = await createMaterial(burger.cookie, "rest_burger")
    await send("DELETE", `${base("rest_burger")}/materials/${item.id}`, burger.cookie)

    expect((await listMaterials(pizza.cookie, "rest_pizzaria", true)).map((entry) => entry.id)).not.toContain(item.id)
    expect((await send("POST", `${base("rest_pizzaria")}/materials/${item.id}/restore`, pizza.cookie)).status).toBe(404)
    expect(
      (await send("DELETE", `${base("rest_pizzaria")}/materials/${item.id}?definitivo=1`, pizza.cookie)).status,
    ).toBe(404)
  })

  it("o cron apaga da lixeira o que passou de 30 dias e preserva o resto", async () => {
    const staff = await staffOf("rest_burger")
    const old = await createMaterial(staff.cookie, "rest_burger", { title: "Velho" })
    const recent = await createMaterial(staff.cookie, "rest_burger", { title: "Recente" })
    const active = await createMaterial(staff.cookie, "rest_burger", { title: "Ativo" })
    const day = 24 * 60 * 60 * 1000
    await env.DB.batch([
      env.DB.prepare("update mkit_materials set deleted_at = ? where id = ?").bind(
        new Date(Date.now() - (RETENTION_DAYS.mkitTrash + 1) * day).toISOString(),
        old.id,
      ),
      env.DB.prepare("update mkit_materials set deleted_at = ? where id = ?").bind(
        new Date(Date.now() - 2 * day).toISOString(),
        recent.id,
      ),
    ])

    const result = await purgeExpired(env)
    expect(result.mkitTrash).toBeGreaterThanOrEqual(1)
    const ids = async () =>
      (
        await env.DB.prepare("select id from mkit_materials where id in (?, ?, ?)")
          .bind(old.id, recent.id, active.id)
          .all<{ id: string }>()
      ).results
        .map((row) => row.id)
        .sort()
    expect(await ids()).toEqual([recent.id, active.id].sort())
  })
})

describe("calendário próprio do restaurante", () => {
  const events = async (cookie: string, restaurantId: string) =>
    envelope(z.array(MkitCalendarEvent)).parse(
      await (await send("GET", `${base(restaurantId)}/calendar`, cookie)).json(),
    ).data ?? []

  it("restaurante sem datas próprias recebe lista vazia", async () => {
    const staff = await staffOf("rest_pizzaria")
    expect(await events(staff.cookie, "rest_pizzaria")).toEqual([])
  })

  it("cria, lista em ordem de data e remove; recorrente é opcional", async () => {
    const staff = await staffOf("rest_burger")
    const later = await send("POST", `${base("rest_burger")}/calendar`, staff.cookie, {
      date: "2026-12-20",
      name: "Festa da casa",
      recurring: true,
    })
    const sooner = await send("POST", `${base("rest_burger")}/calendar`, staff.cookie, {
      date: "2026-03-05",
      name: "Prato do mês",
    })
    expect(later.status).toBe(201)
    const created = envelope(MkitCalendarEvent).parse(await sooner.json()).data as MkitCalendarEvent
    expect(created).toMatchObject({ date: "2026-03-05", name: "Prato do mês", recurring: false })

    const listed = (await events(staff.cookie, "rest_burger")).filter((item) =>
      ["Festa da casa", "Prato do mês"].includes(item.name),
    )
    expect(listed.map((item) => item.name)).toEqual(["Prato do mês", "Festa da casa"])
    expect(listed[1]?.recurring).toBe(true)

    expect((await send("DELETE", `${base("rest_burger")}/calendar/${created.id}`, staff.cookie)).status).toBe(200)
    expect((await events(staff.cookie, "rest_burger")).map((item) => item.id)).not.toContain(created.id)
    expect((await send("DELETE", `${base("rest_burger")}/calendar/${created.id}`, staff.cookie)).status).toBe(404)
  })

  it("recusa data inexistente, formato errado, nome curto e campos extras", async () => {
    const staff = await staffOf("rest_burger")
    const post = (body: unknown) => send("POST", `${base("rest_burger")}/calendar`, staff.cookie, body)
    expect((await post({ date: "2026-02-31", name: "Impossível" })).status).toBe(400)
    expect((await post({ date: "31/12/2026", name: "Formato" })).status).toBe(400)
    expect((await post({ date: "2026-13-01", name: "Mês 13" })).status).toBe(400)
    expect((await post({ date: "2026-12-01", name: "x" })).status).toBe(400)
    expect((await post({ date: "2026-12-01", name: "Ok", extra: true })).status).toBe(400)
    expect((await post({ name: "Sem data" })).status).toBe(400)
    // 29 de fevereiro só existe em ano bissexto.
    expect((await post({ date: "2028-02-29", name: "Bissexto" })).status).toBe(201)
    expect((await post({ date: "2027-02-29", name: "Não bissexto" })).status).toBe(400)
  })

  it("limpa marcação do nome e não mistura restaurantes", async () => {
    const burger = await staffOf("rest_burger")
    const pizza = await staffOf("rest_pizzaria")
    const response = await send("POST", `${base("rest_burger")}/calendar`, burger.cookie, {
      date: "2026-08-01",
      name: "<script>x</script>Dia <b>da casa</b>",
    })
    const created = envelope(MkitCalendarEvent).parse(await response.json()).data as MkitCalendarEvent
    expect(created.name).toBe("Dia da casa")
    expect(await events(pizza.cookie, "rest_pizzaria")).toEqual([])
    expect((await send("DELETE", `${base("rest_pizzaria")}/calendar/${created.id}`, pizza.cookie)).status).toBe(404)
  })
})

describe("geração de conteúdo a partir dos dados do restaurante", () => {
  const generate = (cookie: string, restaurantId: string, body: unknown) =>
    send("POST", `${base(restaurantId)}/materials/generate`, cookie, body)

  it("promoção com desconto calcula o preço no servidor e vira rascunho", async () => {
    const staff = await staffOf("rest_burger")
    const response = await generate(staff.cookie, "rest_burger", {
      template: "promocao",
      productId: "prod_bg_classico",
      discountPercent: 20,
    })
    expect(response.status).toBe(201)
    const item = material.parse(await response.json()).data as MkitMaterial
    expect(item).toMatchObject({ kind: "promocao", status: "draft", medium: "digital", categoryId: null })
    expect(item.body).toContain("20% de desconto")
    expect(item.body).toContain("De R$ 32,90 por apenas R$ 26,32.")
    expect(item.body).toContain("Peça agora pelo Delivery Express.")
    expect(item.title).toMatch(/^Promoção: /)
    // O rascunho entra na lista como qualquer outro material.
    expect((await listMaterials(staff.cookie, "rest_burger")).map((entry) => entry.id)).toContain(item.id)
  })

  it("promoção sem desconto destaca o preço", async () => {
    const staff = await staffOf("rest_burger")
    const item = material.parse(
      await (
        await generate(staff.cookie, "rest_burger", { template: "promocao", productId: "prod_bg_classico" })
      ).json(),
    ).data
    expect(item?.body).toContain("Por apenas R$ 32,90.")
    expect(item?.body).not.toContain("desconto")
  })

  it("novidade usa a descrição quando existe e segue sem ela quando o produto não tem", async () => {
    const staff = await staffOf("rest_burger")
    await env.DB.batch([
      env.DB.prepare("update products set description = 'Pão brioche e blend da casa' where id = 'prod_bg_classico'"),
    ])
    const withDescription = material.parse(
      await (
        await generate(staff.cookie, "rest_burger", { template: "novidade", productId: "prod_bg_classico" })
      ).json(),
    ).data
    expect(withDescription?.body).toContain("Pão brioche e blend da casa")
    expect(withDescription?.kind).toBe("post")

    await env.DB.prepare("update products set description = null where id = 'prod_bg_classico'").run()
    const without = material.parse(
      await (
        await generate(staff.cookie, "rest_burger", { template: "novidade", productId: "prod_bg_classico" })
      ).json(),
    ).data
    expect(without?.body.split("\n")).toHaveLength(2)
    expect(without?.body).toContain("A partir de R$ 32,90.")
  })

  it("data comemorativa não precisa de produto, aceita meio físico e categoria", async () => {
    const staff = await staffOf("rest_burger")
    const response = await generate(staff.cookie, "rest_burger", {
      template: "data",
      eventName: "Dia do Hambúrguer",
      medium: "fisico",
      categoryId: "cat_datas_comemorativas",
    })
    const item = material.parse(await response.json()).data
    expect(item).toMatchObject({ medium: "fisico", categoryId: "cat_datas_comemorativas", kind: "post" })
    expect(item?.body).toContain("Dia do Hambúrguer chegou!")
  })

  it("limpa marcação do texto informado pelo usuário", async () => {
    const staff = await staffOf("rest_burger")
    const item = material.parse(
      await (
        await generate(staff.cookie, "rest_burger", {
          template: "data",
          eventName: "<img src=x onerror=alert(1)>Natal",
        })
      ).json(),
    ).data
    expect(item?.title).not.toMatch(/[<>]/)
    expect(item?.body).not.toMatch(/[<>]/)
    expect(item?.body).toContain("Natal")
  })

  it("dados que faltam ou não são do restaurante dão erro claro", async () => {
    const staff = await staffOf("rest_burger")
    expect((await generate(staff.cookie, "rest_burger", { template: "promocao" })).status).toBe(400)
    expect((await generate(staff.cookie, "rest_burger", { template: "data" })).status).toBe(400)
    expect(
      (await generate(staff.cookie, "rest_burger", { template: "novidade", productId: "nao-existe" })).status,
    ).toBe(404)
    // Produto da pizzaria não serve para o burger.
    expect(
      (await generate(staff.cookie, "rest_burger", { template: "novidade", productId: "prod_pz_carne" })).status,
    ).toBe(404)
    expect((await generate(staff.cookie, "rest_burger", { template: "inexistente" })).status).toBe(400)
    expect(
      (
        await generate(staff.cookie, "rest_burger", {
          template: "promocao",
          productId: "prod_bg_classico",
          discountPercent: 95,
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await generate(staff.cookie, "rest_burger", {
          template: "promocao",
          productId: "prod_bg_classico",
          discountPercent: 0,
        })
      ).status,
    ).toBe(400)
    expect(
      (await generate(staff.cookie, "rest_burger", { template: "data", eventName: "Natal", categoryId: "nao-existe" }))
        .status,
    ).toBe(400)
  })
})

describe("modelos de texto", () => {
  it("formata centavos em reais sem usar ponto flutuante", () => {
    expect(formatBrl(0)).toBe("R$ 0,00")
    expect(formatBrl(5)).toBe("R$ 0,05")
    expect(formatBrl(100)).toBe("R$ 1,00")
    expect(formatBrl(3290)).toBe("R$ 32,90")
    expect(formatBrl(123456)).toBe("R$ 1.234,56")
    expect(formatBrl(100000000)).toBe("R$ 1.000.000,00")
  })

  it("desconto arredonda para o centavo mais próximo", () => {
    expect(discounted(3290, 20)).toBe(2632)
    expect(discounted(999, 15)).toBe(849)
    expect(discounted(1000, 90)).toBe(100)
    expect(discounted(1, 50)).toBe(1)
  })
})
