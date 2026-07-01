'use client'

import { TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react'
import type { SalesTrendRow } from '@/types'

interface SalesDropListProps {
  rows: SalesTrendRow[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function SalesDropList({ rows, selectedId, onSelect }: SalesDropListProps) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700">Nenhum produto com vendas registradas</p>
        <p className="text-sm text-slate-400 mt-1">
          Registre as vendas diárias de um produto para detectar quedas de tendência.
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
            <th className="text-right font-medium px-4 py-2.5">30d ant.</th>
            <th className="text-right font-medium px-4 py-2.5">Últimos 30d</th>
            <th className="text-right font-medium px-4 py-2.5">Variação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr
              key={r.listingId}
              onClick={() => onSelect(r.listingId)}
              className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                selectedId === r.listingId ? 'bg-blue-50' : ''
              } ${r.hasDrop ? 'bg-red-50/50' : ''}`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {r.hasDrop && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  <span className="font-medium text-slate-800 truncate max-w-[280px]">{r.title}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-slate-500">{r.unitsPrevious30}</td>
              <td className="px-4 py-3 text-right text-slate-700 font-medium">{r.unitsRecent30}</td>
              <td className="px-4 py-3 text-right">
                {r.declinePercent > 0 ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                    <TrendingDown className="w-3.5 h-3.5" />-{r.declinePercent.toFixed(0)}%
                  </span>
                ) : (
                  <span className="text-slate-400">estável</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
