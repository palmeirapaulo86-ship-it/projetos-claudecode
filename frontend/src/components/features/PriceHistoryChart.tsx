'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { LineChart as LineIcon } from 'lucide-react'
import { usePriceHistory } from '@/hooks/usePriceMonitor'
import { Skeleton } from '@/components/shared/Skeleton'

interface PriceHistoryChartProps {
  competitorId: string | null
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Gráfico de histórico de preço das últimas 24h do concorrente selecionado.
export function PriceHistoryChart({ competitorId }: PriceHistoryChartProps) {
  const { data, isLoading, isError } = usePriceHistory(competitorId, 24)

  if (competitorId === null) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
        <LineIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm">Selecione um concorrente na tabela para ver o histórico de preço.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-red-600">
        Não foi possível carregar o histórico. Tente novamente em instantes.
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
        Ainda não há histórico nas últimas 24h. A próxima coleta acontece a cada 30 minutos.
      </div>
    )
  }

  const pontos = data.map((p) => ({
    hora: new Date(p.capturedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    preco: p.price,
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Preço nas últimas 24h</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={pontos} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="hora" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => brl(Number(v))} width={80} />
          <Tooltip formatter={(v) => brl(Number(v))} labelStyle={{ color: '#475569' }} />
          <Line type="monotone" dataKey="preco" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
