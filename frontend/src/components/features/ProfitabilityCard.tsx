'use client'

import { AlertTriangle, Sparkles, Loader2, Lightbulb } from 'lucide-react'
import { useProfitabilityAi } from '@/hooks/useProfitability'
import type { ProfitabilityDetail } from '@/types'

interface ProfitabilityCardProps {
  listingId: string
  detail: ProfitabilityDetail
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const urgenciaCor: Record<string, string> = {
  alta: 'bg-red-50 text-red-700 border-red-200',
  media: 'bg-amber-50 text-amber-700 border-amber-200',
  baixa: 'bg-green-50 text-green-700 border-green-200',
}

// Card de rentabilidade individual: quebra de custos + análise da IA sob demanda.
export function ProfitabilityCard({ listingId, detail }: ProfitabilityCardProps) {
  const { state, analyze } = useProfitabilityAi(listingId)

  const linha = (label: string, valor: string, forte = false, cor = 'text-slate-700') => (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm ${forte ? 'font-semibold' : ''} ${cor}`}>{valor}</span>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <h3 className="text-base font-semibold text-slate-800">{detail.title}</h3>

      {/* Alerta visual de prejuízo */}
      {detail.isLoss && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">
            Este produto está no <strong>prejuízo</strong>. Preço mínimo para empatar:{' '}
            <strong>{brl(detail.breakEvenPrice)}</strong>.
          </p>
        </div>
      )}

      {/* Quebra de custos */}
      <div className="divide-y divide-slate-100">
        {linha('Preço de venda', brl(detail.price))}
        {linha('Taxa da plataforma', `- ${brl(detail.platformFeeValue)}`)}
        {linha('Perda por devoluções', `- ${brl(detail.returnLossValue)}`)}
        {linha('Custo total', brl(detail.totalCost))}
        {linha(
          'Lucro líquido',
          brl(detail.netProfit),
          true,
          detail.isLoss ? 'text-red-600' : 'text-green-600'
        )}
        {linha('Margem', `${detail.marginPercent.toFixed(2)}%`, true, detail.isLoss ? 'text-red-600' : 'text-slate-800')}
        {linha('Ponto de equilíbrio', brl(detail.breakEvenPrice))}
      </div>

      {/* Análise da IA */}
      <div className="pt-2 border-t border-slate-100">
        {state.phase === 'idle' && (
          <button
            onClick={analyze}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Sparkles className="w-4 h-4" />
            Gerar análise e recomendação da IA
          </button>
        )}
        {state.phase === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analisando com IA...
          </div>
        )}
        {state.phase === 'error' && <p className="text-sm text-red-600">{state.message}</p>}
        {state.phase === 'done' && (
          <div className={`rounded-lg border px-3 py-3 space-y-2 ${urgenciaCor[state.ai.urgencia] ?? ''}`}>
            <p className="text-sm">{state.ai.analise}</p>
            <p className="text-sm flex items-start gap-1.5">
              <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><strong>Recomendação:</strong> {state.ai.recomendacao}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
