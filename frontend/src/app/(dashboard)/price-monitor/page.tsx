'use client'

import { useState } from 'react'
import { Plus, TrendingUp, AlertTriangle, Bell, Loader2 } from 'lucide-react'
import {
  useCompetitors,
  useAddCompetitor,
  useAlerts,
  useCreateAlert,
} from '@/hooks/usePriceMonitor'
import { CompetitorsTable } from '@/components/features/CompetitorsTable'
import { PriceHistoryChart } from '@/components/features/PriceHistoryChart'
import { TableSkeleton } from '@/components/shared/Skeleton'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function PriceMonitorPage() {
  // Placeholder enquanto a importação de anúncios não existe (igual à Feature 1)
  const listingId = 'demo'
  const [url, setUrl] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading, isError } = useCompetitors(listingId)
  const addCompetitor = useAddCompetitor(listingId)
  const alerts = useAlerts(listingId)
  const createAlert = useCreateAlert(listingId)

  function onAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    addCompetitor.mutate(url.trim(), { onSuccess: () => setUrl('') })
  }

  const temAlertaPreco = alerts.data?.some((a) => a.type === 'price_drop')
  const temAlertaBuyBox = alerts.data?.some((a) => a.type === 'buy_box_lost')

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Monitor de Preço</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Acompanhe os concorrentes em tempo real — coleta automática a cada 30 minutos.
        </p>
      </div>

      {/* Alerta visual: preço próprio acima da concorrência */}
      {data?.acimaDaConcorrencia && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Seu preço está acima da concorrência</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Seu anúncio: <strong>{data.precoProprio !== null ? brl(data.precoProprio) : '—'}</strong>{' '}
              · menor concorrente:{' '}
              <strong>{data.menorPrecoConcorrente !== null ? brl(data.menorPrecoConcorrente) : '—'}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Formulário de adicionar concorrente */}
      <form onSubmit={onAdd} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Cole a URL do anúncio concorrente no Mercado Livre"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button
          type="submit"
          disabled={addCompetitor.isPending || !url.trim()}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {addCompetitor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Adicionar
        </button>
      </form>
      {addCompetitor.isError && (
        <p className="text-sm text-red-600 -mt-4">{(addCompetitor.error as Error).message}</p>
      )}

      {/* Configuração de alertas */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
          <Bell className="w-4 h-4 text-primary" />
          Alertas
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => createAlert.mutate({ type: 'price_drop', config: { thresholdReais: 0 } })}
            disabled={temAlertaPreco || createAlert.isPending}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {temAlertaPreco ? '✓ Queda de preço ativo' : 'Avisar quando concorrente baixar o preço'}
          </button>
          <button
            onClick={() => createAlert.mutate({ type: 'buy_box_lost' })}
            disabled={temAlertaBuyBox || createAlert.isPending}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {temAlertaBuyBox ? '✓ Perda de buy box ativo' : 'Avisar quando eu perder o buy box'}
          </button>
        </div>
      </div>

      {/* Tabela de concorrentes */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          Concorrentes
        </h3>
        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            Não foi possível carregar os concorrentes.
          </div>
        ) : (
          <CompetitorsTable
            competitors={data?.competitors ?? []}
            menorPreco={data?.menorPrecoConcorrente ?? null}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}
      </div>

      {/* Gráfico de histórico */}
      <PriceHistoryChart competitorId={selectedId} />
    </div>
  )
}
