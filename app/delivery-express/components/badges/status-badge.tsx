interface StatusBadgeProps {
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "canceled"
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pendente" },
    confirmed: { bg: "bg-blue-100", text: "text-blue-800", label: "Confirmado" },
    preparing: { bg: "bg-purple-100", text: "text-purple-800", label: "Preparando" },
    ready: { bg: "bg-green-100", text: "text-green-800", label: "Pronto" },
    delivering: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Em entrega" },
    delivered: { bg: "bg-green-100", text: "text-green-800", label: "Entregue" },
    canceled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelado" },
  }

  const config = statusConfig[status]

  return <span className={`${config.bg} ${config.text} text-xs px-2 py-1 rounded`}>{config.label}</span>
}
