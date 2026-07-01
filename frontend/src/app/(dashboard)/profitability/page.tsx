'use client'

import { useState } from 'react'
import { DollarSign, AlertTriangle } from 'lucide-react'
import { useProfitabilityList, useProfitabilityDetail } from '@/hooks/useProfitability'
import { ProfitabilityTable } from '@/components/features/ProfitabilityTable'
import { ProfitabilityCard } from '@/components/features/ProfitabilityCard'
import { MarginChart } from '@/components/features/MarginChart'
import { CostForm } from '@/components/features/CostForm'
import { TableSkeleton, CardSkeleton } from '@/components/shared/Skeleton'

export default function ProfitabilityPage() {
  // Placeholder de anúncio para cadastrar custos (igual às features anteriores)
  const DEMO_LISTING = 'demo'
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const list = useProfitabilityList()
  const detail = useProfitabilityDetail(selectedId)

  const emPrejuizo = list.data?.filter((p) => p.isLoss).length ?? 0

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Rentabilidade Real</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Lucro real por produto depois de custo, frete, taxa e devoluções.
        </p>
      </div>

      {/* Resumo de produtos no prejuízo */}
      {emPrejuizo > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <strong>{emPrejuizo}</strong> produto{emPrejuizo > 1 ? 's' : ''} no prejuízo. Veja os primeiros da tabela.
          </p>
        </div>
      )}

      {/* Tabela ordenada por margem */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
          <DollarSign className="w-4 h-4 text-primary" />
          Produtos por margem (piores primeiro)
        </h3>
        {list.isLoading ? (
          <TableSkeleton rows={4} />
        ) : list.isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            Não foi possível carregar a rentabilidade.
          </div>
        ) : (
          <ProfitabilityTable
            rows={list.data ?? []}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}
      </div>

      {/* Cadastro de custos — usa o produto selecionado ou o demo */}
      <CostForm
        listingId={selectedId ?? DEMO_LISTING}
        initial={undefined}
      />

      {/* Detalhe do produto selecionado */}
      {selectedId && (
        <>
          {detail.isLoading ? (
            <CardSkeleton />
          ) : detail.isError ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
              Cadastre os custos deste produto para ver a rentabilidade.
            </div>
          ) : detail.data ? (
            <>
              <ProfitabilityCard listingId={selectedId} detail={detail.data} />
              <MarginChart history={detail.data.history} />
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
