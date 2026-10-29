interface DiscountBadgeProps {
  percentage: number
}

export function DiscountBadge({ percentage }: DiscountBadgeProps) {
  return <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">{percentage}% OFF</span>
}
