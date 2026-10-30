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

/**
 * Um objeto por restaurante: numera os eventos de pedido, guarda os mais
 * recentes no SQLite do objeto e distribui por WebSocket com Hibernation
 * (conexões ociosas não consomem duração). Sockets da equipe recebem tudo do
 * restaurante; sockets de cliente recebem só o próprio pedido.
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

  /** Grava o evento antes de distribuir: quem reconectar depois ainda o recebe. */
  async publish(event: Omit<LiveEvent, "seq">): Promise<LiveEvent> {
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
    for (const socket of [
      ...this.ctx.getWebSockets(RESTAURANT_TAG),
      ...this.ctx.getWebSockets(orderTag(event.orderId)),
    ]) {
      try {
        socket.send(message)
      } catch {
        // Socket já fechado: o próximo webSocketClose limpa a conexão.
      }
    }
    return stored
  }

  /**
   * Abre o WebSocket. O Worker já validou o ticket e informa o escopo nos
   * headers internos; este objeto só é alcançável pelo binding.
   */
  override async fetch(request: Request): Promise<Response> {
    if (request.headers.get("upgrade") !== "websocket") return new Response("upgrade obrigatório", { status: 426 })

    const orderId = request.headers.get("x-live-order")
    const tag = orderId ? orderTag(orderId) : RESTAURANT_TAG
    const since = Number(request.headers.get("x-live-since") ?? "0")

    const { 0: client, 1: server } = new WebSocketPair()
    this.ctx.acceptWebSocket(server, [tag])

    // Reenvia o que foi perdido desde o último seq conhecido pelo cliente.
    if (Number.isSafeInteger(since) && since > 0) {
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

    return new Response(null, { status: 101, webSocket: client })
  }

  override async webSocketClose(socket: WebSocket, code: number): Promise<void> {
    socket.close(code === 1005 ? 1000 : code, "encerrado")
  }

  override async webSocketError(socket: WebSocket): Promise<void> {
    socket.close(1011, "erro")
  }
}
