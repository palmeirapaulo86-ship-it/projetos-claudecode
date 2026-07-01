'use client'

import { Sparkles, Loader2, Search, ListChecks, FileSearch } from 'lucide-react'
import { UrgencyBadge } from './UrgencyBadge'
import { useSalesDiagnosis } from '@/hooks/useSalesDrop'
import type { SalesTrend } from '@/types'

interface DiagnosisCardProps {
  listingId: string
  trend: SalesTrend
}

// Card de diagnóstico da IA: causa provável, evidências e ações recomendadas.
export function DiagnosisCard({ listingId, trend }: DiagnosisCardProps) {
  const { state, diagnose } = useSalesDiagnosis(listingId)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">Diagnóstico de vendas</h3>
        {trend.hasDrop ? (
          <span className="text-xs font-medium text-red-600">Queda de {trend.declinePercent.toFixed(0)}%</span>
        ) : (
          <span className="text-xs text-slate-400">Sem queda relevante</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-xs text-slate-400">Últimos 30 dias</p>
          <p className="font-semibold text-slate-800">{trend.unitsRecent30} un.</p>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-xs text-slate-400">30 dias anteriores</p>
          <p className="font-semibold text-slate-800">{trend.unitsPrevious30} un.</p>
        </div>
      </div>

      {state.phase === 'idle' && (
        <button onClick={diagnose} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
          <Sparkles className="w-4 h-4" />
          Gerar diagnóstico da IA (causa + ações)
        </button>
      )}
      {state.phase === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Diagnosticando com IA...
        </div>
      )}
      {state.phase === 'error' && <p className="text-sm text-red-600">{state.message}</p>}
      {state.phase === 'done' && (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Search className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-500">Causa provável</p>
                <p className="text-sm text-slate-700">{state.diagnosis.causa_provavel}</p>
              </div>
            </div>
            <UrgencyBadge urgencia={state.diagnosis.urgencia} />
          </div>

          {state.diagnosis.evidencias.length > 0 && (
            <div className="flex items-start gap-2">
              <FileSearch className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-500">Evidências</p>
                <ul className="mt-0.5 space-y-1">
                  {state.diagnosis.evidencias.map((e, i) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-slate-300">•</span>{e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <ListChecks className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-500">Ações recomendadas</p>
              <ul className="mt-0.5 space-y-1">
                {state.diagnosis.acoes_recomendadas.map((a, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <span className="text-green-400">✓</span>{a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
