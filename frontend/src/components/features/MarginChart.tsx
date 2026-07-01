'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

interface MarginChartProps {
  history: { marginPercent: number; capturedAt: string }[]
}

// Gráfico de margem (%) ao longo do tempo. Linha em 0% marca a fronteira do prejuízo.
export function MarginChart({ history }: MarginChartProps) {
  if (history.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-400">
        O gráfico de margem aparece após pelo menos duas atualizações de custo.
      </div>
    )
  }

  const pontos = history.map((h) => ({
    data: new Date(h.capturedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    margem: h.marginPercent,
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Margem ao longo do tempo</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={pontos} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} width={48} />
          <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} labelStyle={{ color: '#475569' }} />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="margem" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
