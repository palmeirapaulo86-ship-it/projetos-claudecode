'use client'

import { useState } from 'react'
import { LineChart, AlertTriangle } from 'lucide-react'
import { useSalesTrends, useSalesDetail } from '@/hooks/useSalesDrop'
import { SalesDropList } from '@/components/features/SalesDropList'
import { SalesTrendChart } from '@/components/features/SalesTrendChart'
import { DiagnosisCard } from '@/components/features/DiagnosisCard'
import { TableSkeleton, CardSkeleton } from '@/components/shared/Skeleton'

export default function SalesDropPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const trends = useSalesTrends()
  const detail = useSalesDetail(selectedId)

  const comQueda = trends.data?.filter((t) => t.hasDrop).length ?? 0

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Queda de Vendas</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Detecta produtos perdendo tração comparando os últimos 30 dias com os 30 anteriores.
        </p>
      </div>

      {/* Resumo de produtos em queda */}
      {comQueda > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <strong>{comQueda}</strong> produto{comQueda > 1 ? 's' : ''} com queda de vendas detectada.
          </p>
        </div>
      )}

      {/* Lista de produtos */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
          <LineChart className="w-4 h-4 text-primary" />
          Produtos por tendência (quedas primeiro)
        </h3>
        {trends.isLoading ? (
          <TableSkeleton rows={4} />
        ) : trends.isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            Não foi possível carregar as tendências.
          </div>
        ) : (
          <SalesDropList rows={trends.data ?? []} selectedId={selectedId} onSelect={setSelectedId} />
        )}
      </div>

      {/* Detalhe do produto selecionado */}
      {selectedId && (
        <>
          {detail.isLoading ? (
            <CardSkeleton />
          ) : detail.isError ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
              Sem dados de vendas para este produto.
            </div>
          ) : detail.data ? (
            <>
              <SalesTrendChart series={detail.data.series} />
              <DiagnosisCard listingId={selectedId} trend={detail.data.trend} />
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
