import { Crown } from 'lucide-react'

interface BuyBoxBadgeProps {
  hasBuyBox: boolean
}

// Badge que destaca quem detém o buy box (a oferta principal).
export function BuyBoxBadge({ hasBuyBox }: BuyBoxBadgeProps) {
  if (!hasBuyBox) {
    return <span className="text-xs text-slate-400">—</span>
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
      <Crown className="w-3 h-3" />
      Buy Box
    </span>
  )
}
