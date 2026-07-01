'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { SalesPoint } from '@/types'

interface SalesTrendChartProps {
  series: SalesPoint[]
}

// Gráfico de tendência de vendas diárias (unidades) nos últimos 90 dias.
export function SalesTrendChart({ series }: SalesTrendChartProps) {
  if (series.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-400">
        Registre pelo menos dois dias de vendas para ver a tendência.
      </div>
    )
  }

  const pontos = series.map((s) => ({
    data: new Date(`${s.date}T00:00:00Z`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    unidades: s.units,
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Vendas diárias (90 dias)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={pontos} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="data" tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={32} allowDecimals={false} />
          <Tooltip labelStyle={{ color: '#475569' }} formatter={(v) => [`${v} un.`, 'Vendas']} />
          <Area type="monotone" dataKey="unidades" stroke="#2563eb" strokeWidth={2} fill="url(#salesFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
