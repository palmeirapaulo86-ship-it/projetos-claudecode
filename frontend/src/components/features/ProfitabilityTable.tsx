'use client'

import { TrendingDown, AlertTriangle, Package } from 'lucide-react'
import type { ProfitabilityRow } from '@/types'

interface ProfitabilityTableProps {
  rows: ProfitabilityRow[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function ProfitabilityTable({ rows, selectedId, onSelect }: ProfitabilityTableProps) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700">Nenhum produto com custos cadastrados</p>
        <p className="text-sm text-slate-400 mt-1">
          Selecione um produto e cadastre custo, frete e taxa para ver a rentabilidade real.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="text-left font-medium px-4 py-2.5">Produto</th>
            <th className="text-right font-medium px-4 py-2.5">Preço</th>
            <th className="text-right font-medium px-4 py-2.5">Lucro/un.</th>
            <th className="text-right font-medium px-4 py-2.5">Margem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr
              key={r.listingId}
              onClick={() => onSelect(r.listingId)}
              className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                selectedId === r.listingId ? 'bg-blue-50' : ''
              } ${r.isLoss ? 'bg-red-50/50' : ''}`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {r.isLoss && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  <span className="font-medium text-slate-800 truncate max-w-[280px]">{r.title}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-slate-600">{brl(r.price)}</td>
              <td className={`px-4 py-3 text-right font-semibold ${r.isLoss ? 'text-red-600' : 'text-slate-800'}`}>
                {brl(r.netProfit)}
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    r.isLoss ? 'text-red-600' : r.marginPercent < 10 ? 'text-amber-600' : 'text-green-600'
                  }`}
                >
                  {r.isLoss && <TrendingDown className="w-3.5 h-3.5" />}
                  {r.marginPercent.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
