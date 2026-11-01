import { DurableObject } from "cloudflare:workers"

export type LiveEvent = {
  seq: number
  type: "order.created" | "order.updated"
  orderId: string
  status: string
  at: string
}

/** Quantos eventos ficam guardados para reenvio na reconexão. */
const RETAINED_EVENTS = 500
const RESTAURANT_TAG = "restaurant"
const orderTag = (orderId: string) => `order:${orderId}`
/** Código de fechamento quando o vínculo da equipe foi revogado (faixa 4000+ é da aplicação). */
const REVOKED_CLOSE_CODE = 4403

type Attachment = { sub: string; restaurantId: string }

/**
 * Um objeto por restaurante: numera os eventos de pedido, guarda os mais
 * recentes no SQLite do objeto e distribui por WebSocket com Hibernation
 * (conexões ociosas não consomem duração). Sockets da equipe recebem tudo do
 * restaurante e têm o vínculo revalidado a cada evento; sockets de cliente
 * recebem só o próprio pedido.
 */
export class RestaurantRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        create table if not exists events (
          seq integer primary key autoincrement,
          type text not null,
          order_id text not null,
          status text not null,
          at text not null
        )
      `)
    })
    // Responde ping sem acordar o objeto.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"))
  }

  /**
   * Grava e distribui o evento. Um evento mais antigo que o último gravado para o
   * mesmo pedido é descartado: ele chegou atrasado e não pode sobrescrever um estado
   * mais novo na ordem que o cliente vê. Retorna null quando descartado.
   */
  async publish(event: Omit<LiveEvent, "seq">): Promise<LiveEvent | null> {
    const last = this.ctx.storage.sql
      .exec<{ at: string; status: string }>(
        "select at, status from events where order_id = ? order by seq desc limit 1",
        event.orderId,
      )
      .toArray()[0]
    if (last && last.at > event.at) return null
    // Reenvio da caixa de saída (at-least-once): o mesmo evento não é gravado nem distribuído duas vezes.
    if (last && last.at === event.at && last.status === event.status) return null

    const { seq } = this.ctx.storage.sql
      .exec<{ seq: number }>(
        "insert into events (type, order_id, status, at) values (?, ?, ?, ?) returning seq",
        event.type,
        event.orderId,
        event.status,
        event.at,
      )
      .one()
    this.ctx.storage.sql.exec("delete from events where seq <= ?", seq - RETAINED_EVENTS)

    const stored: LiveEvent = { ...event, seq }
    const message = JSON.stringify(stored)
    for (const socket of this.ctx.getWebSockets(RESTAURANT_TAG)) {
      if (!(await this.stillAuthorized(socket))) {
        socket.close(REVOKED_CLOSE_CODE, "vínculo revogado")
        continue
      }
      this.safeSend(socket, message)
    }
    for (const socket of this.ctx.getWebSockets(orderTag(event.orderId))) this.safeSend(socket, message)
    return stored
  }

  /** O vínculo é revalidado a cada evento: a autorização do ticket vale só no momento da abertura. */
  private async stillAuthorized(socket: WebSocket): Promise<boolean> {
    const attachment = socket.deserializeAttachment() as Attachment | null
    if (!attachment) return false
    const row = await this.env.DB.prepare(
      "select u.role as role, exists(select 1 from restaurant_members m where m.user_id = u.id and m.restaurant_id = ?) as member from user u where u.id = ?",
    )
      .bind(attachment.restaurantId, attachment.sub)
      .first<{ role: string; member: number }>()
    if (!row) return false
    if (row.role === "admin") return true
    return row.role === "restaurant_staff" && row.member === 1
  }

  private safeSend(socket: WebSocket, message: string) {
    try {
      socket.send(message)
    } catch {
      // Socket já fechado: o próximo webSocketClose limpa a conexão.
    }
  }

  /**
   * Abre o WebSocket. O Worker já validou o ticket e informa escopo, usuário e
   * restaurante nos headers internos; este objeto só é alcançável pelo binding.
   */
  override async fetch(request: Request): Promise<Response> {
    if (request.headers.get("upgrade") !== "websocket") return new Response("upgrade obrigatório", { status: 426 })

    const orderId = request.headers.get("x-live-order")
    const tag = orderId ? orderTag(orderId) : RESTAURANT_TAG
    const cursor = request.headers.get("x-live-since")

    const { 0: client, 1: server } = new WebSocketPair()
    this.ctx.acceptWebSocket(server, [tag])
    server.serializeAttachment({
      sub: request.headers.get("x-live-sub") ?? "",
      restaurantId: request.headers.get("x-live-restaurant") ?? "",
    } satisfies Attachment)

    // Reenvia o que foi perdido desde o cursor. A ausência do cursor é diferente de zero:
    // since=0 significa "desde o início" e precisa reenviar os eventos retidos.
    if (cursor !== null) {
      const since = Number(cursor)
      if (Number.isSafeInteger(since) && since >= 0) {
        const missed = orderId
          ? this.ctx.storage.sql.exec<LiveEvent>(
              "select seq, type, order_id as orderId, status, at from events where seq > ? and order_id = ? order by seq",
              since,
              orderId,
            )
          : this.ctx.storage.sql.exec<LiveEvent>(
              "select seq, type, order_id as orderId, status, at from events where seq > ? order by seq",
              since,
            )
        for (const event of missed) server.send(JSON.stringify(event))
      }
    }

    return new Response(null, { status: 101, webSocket: client })
  }

  override async webSocketClose(socket: WebSocket, code: number): Promise<void> {
    socket.close(code === 1005 ? 1000 : code, "encerrado")
  }

  override async webSocketError(socket: WebSocket): Promise<void> {
    socket.close(1011, "erro")
  }
}
