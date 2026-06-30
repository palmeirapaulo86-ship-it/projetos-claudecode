'use client'

import { BuyBoxBadge } from './BuyBoxBadge'
import { Package } from 'lucide-react'
import type { Competitor } from '@/types'

interface CompetitorsTableProps {
  competitors: Competitor[]
  menorPreco: number | null
  selectedId: string | null
  onSelect: (id: string) => void
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function CompetitorsTable({ competitors, menorPreco, selectedId, onSelect }: CompetitorsTableProps) {
  // Estado vazio com instrução do que fazer
  if (competitors.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700">Nenhum concorrente monitorado</p>
        <p className="text-sm text-slate-400 mt-1">
          Adicione a URL de um anúncio concorrente do Mercado Livre para começar a monitorar o preço.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="text-left font-medium px-4 py-2.5">Vendedor</th>
            <th className="text-right font-medium px-4 py-2.5">Preço</th>
            <th className="text-right font-medium px-4 py-2.5">Estoque</th>
            <th className="text-center font-medium px-4 py-2.5">Buy Box</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {competitors.map((c) => {
            const ehMenor = menorPreco !== null && c.price === menorPreco
            return (
              <tr
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                  selectedId === c.id ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{c.sellerName}</p>
                  <p className="text-xs text-slate-400 truncate max-w-[260px]">{c.title}</p>
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${ehMenor ? 'text-green-600' : 'text-slate-800'}`}>
                  {brl(c.price)}
                  {ehMenor && <span className="block text-xs font-normal text-green-500">menor preço</span>}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">{c.stock ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <BuyBoxBadge hasBuyBox={c.hasBuyBox} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
