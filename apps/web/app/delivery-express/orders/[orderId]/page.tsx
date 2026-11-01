import Link from "next/link"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import type { Order } from "@delivery/contracts"
import { isOnlinePayment } from "@delivery/contracts"
import { getApiClient } from "@/lib/api"
import { formatCents } from "@/lib/utils"
import { PaymentRetry } from "./payment-retry"

export const dynamic = "force-dynamic"
export const metadata = { title: "Seu pedido | Delivery Express" }

const STATUS_LABEL: Record<Order["status"], string> = {
  pending: "Aguardando o restaurante",
  accepted: "Pedido aceito",
  preparing: "Em preparo",
  ready: "Pronto",
  dispatched: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
}

const PAYMENT_LABEL: Record<Order["payment"]["status"], string> = {
  pending: "Pagamento pendente",
  paid: "Pago",
  failed: "Pagamento não concluído",
  refunded: "Reembolsado",
}

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const client = getApiClient()
  if (!client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p role="alert">Não foi possível carregar o pedido agora. Tente de novo em instantes.</p>
      </div>
    )
  }

  const cookie = (await cookies()).toString()
  const result = await client.getOrder(orderId, { headers: { cookie } })
  if (!result.ok) {
    if (result.error.code === "not_found" || result.error.code === "unauthenticated") notFound()
    return (
      <div className="container mx-auto px-4 py-8">
        <p role="alert">Não foi possível carregar o pedido agora. Tente de novo em instantes.</p>
      </div>
    )
  }

  const order = result.data
  const online = isOnlinePayment(order.payment.method)

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Pedido {order.id.slice(0, 8)}</h1>
      <p className="mb-6 text-lg" role="status">
        {STATUS_LABEL[order.status]}
      </p>

      <section aria-labelledby="pagamento" className="mb-8 rounded-lg border p-4">
        <h2 id="pagamento" className="mb-2 font-semibold">
          Pagamento: {PAYMENT_LABEL[order.payment.status]}
        </h2>
        {!online && <p>Você paga na entrega.</p>}
        {online && order.payment.status === "pending" && order.charge?.pix && (
          <div>
            <p className="mb-2">Pague com Pix: escaneie o QR Code ou use o código copia e cola.</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- imagem em Base64 vinda do Asaas */}
            <img
              src={`data:image/png;base64,${order.charge.pix.qrCodeImage}`}
              alt="QR Code do Pix"
              width={220}
              height={220}
              className="mb-2"
            />
            <label className="block text-sm">
              Pix copia e cola
              <textarea
                readOnly
                value={order.charge.pix.payload}
                rows={3}
                className="mt-1 w-full rounded-md border p-2 font-mono text-xs"
              />
            </label>
          </div>
        )}
        {online && order.payment.status === "pending" && order.charge?.invoiceUrl && !order.charge.pix && (
          <p>
            <a
              href={order.charge.invoiceUrl}
              rel="noopener noreferrer"
              className="inline-block rounded-md bg-orange-600 px-4 py-2 font-semibold text-white"
            >
              Pagar com cartão (crédito ou débito)
            </a>
          </p>
        )}
        {online && order.payment.status !== "paid" && order.payment.status !== "refunded" && !order.charge && (
          <PaymentRetry orderId={order.id} />
        )}
      </section>

      <section aria-labelledby="resumo" className="mb-8">
        <h2 id="resumo" className="mb-2 font-semibold">
          Resumo
        </h2>
        <ul className="mb-2 space-y-1">
          {order.quote.lines.map((line) => (
            <li key={`${line.productId}-${line.lineTotalCents}`} className="flex justify-between">
              <span>
                {line.quantity}× {line.name}
              </span>
              <span>{formatCents(line.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between">
          <span>Entrega</span>
          <span>{formatCents(order.quote.deliveryCents)}</span>
        </p>
        <p className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatCents(order.quote.totalCents)}</span>
        </p>
      </section>

      <section aria-labelledby="acompanhamento">
        <h2 id="acompanhamento" className="mb-2 font-semibold">
          Acompanhamento
        </h2>
        <ol className="space-y-1">
          {order.timeline.map((event) => (
            <li key={`${event.status}-${event.at}`}>
              {STATUS_LABEL[event.status]}{" "}
              <time dateTime={event.at} className="text-sm text-gray-600">
                {new Date(event.at).toLocaleString("pt-BR")}
              </time>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-8">
        <Link href="/delivery-express" className="underline">
          Voltar ao início
        </Link>
      </p>
    </div>
  )
}
