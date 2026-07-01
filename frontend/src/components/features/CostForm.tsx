'use client'

import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { useUpsertCosts } from '@/hooks/useProfitability'

interface CostFormProps {
  listingId: string
  initial?: { productCost: number; shippingCost: number; platformFeePercent: number; returnRatePercent: number }
}

// Formulário de custos do produto. Valida no cliente antes de enviar.
export function CostForm({ listingId, initial }: CostFormProps) {
  const [productCost, setProductCost] = useState(String(initial?.productCost ?? ''))
  const [shippingCost, setShippingCost] = useState(String(initial?.shippingCost ?? ''))
  const [feePercent, setFeePercent] = useState(String(initial?.platformFeePercent ?? ''))
  const [returnRate, setReturnRate] = useState(String(initial?.returnRatePercent ?? '0'))
  const upsert = useUpsertCosts(listingId)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = {
      productCost: Number(productCost),
      shippingCost: Number(shippingCost),
      platformFeePercent: Number(feePercent),
      returnRatePercent: Number(returnRate || 0),
    }
    if ([body.productCost, body.shippingCost, body.platformFeePercent].some((n) => Number.isNaN(n))) return
    upsert.mutate(body)
  }

  const campo = (label: string, value: string, set: (v: string) => void, sufixo: string) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => set(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{sufixo}</span>
      </div>
    </div>
  )

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-800">Custos do produto</h3>
      <div className="grid grid-cols-2 gap-3">
        {campo('Custo do produto', productCost, setProductCost, 'R$')}
        {campo('Frete por unidade', shippingCost, setShippingCost, 'R$')}
        {campo('Taxa da plataforma', feePercent, setFeePercent, '%')}
        {campo('Devoluções', returnRate, setReturnRate, '%')}
      </div>
      {upsert.isError && <p className="text-xs text-red-600">{(upsert.error as Error).message}</p>}
      {upsert.isSuccess && <p className="text-xs text-green-600">Custos salvos e rentabilidade recalculada.</p>}
      <button
        type="submit"
        disabled={upsert.isPending}
        className="flex items-center gap-1.5 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {upsert.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar custos
      </button>
    </form>
  )
}
