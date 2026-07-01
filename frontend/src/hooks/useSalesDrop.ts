'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useCallback, useRef, useEffect } from 'react'
import { api } from '@/lib/api'
import type {
  SalesTrendRow,
  SalesTrend,
  SalesPoint,
  DiagnosisStatus,
  SalesDiagnosisOutput,
} from '@/types'

// Lista de produtos com quedas primeiro
export function useSalesTrends() {
  return useQuery({
    queryKey: ['sales-trends'],
    queryFn: async () => {
      const res = await api.get<SalesTrendRow[]>('/api/sales/trends')
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Erro ao carregar tendências')
      return res.data
    },
  })
}

// Série de vendas + tendência de um produto
export function useSalesDetail(listingId: string | null) {
  return useQuery({
    queryKey: ['sales-detail', listingId],
    enabled: listingId !== null,
    queryFn: async () => {
      const res = await api.get<{ series: SalesPoint[]; trend: SalesTrend }>(
        `/api/listings/${listingId}/sales`
      )
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Sem dados de vendas')
      return res.data
    },
    retry: false,
  })
}

type DiagState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; diagnosis: SalesDiagnosisOutput }

const POLL_MS = 2000
const MAX_TENTATIVAS = 30

// Diagnóstico da IA via fila + polling (mesmo padrão das outras features)
export function useSalesDiagnosis(listingId: string) {
  const [state, setState] = useState<DiagState>({ phase: 'idle' })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const poll = useCallback(
    async (jobId: string, tentativa: number) => {
      if (tentativa > MAX_TENTATIVAS) {
        setState({ phase: 'error', message: 'O diagnóstico demorou mais que o esperado.' })
        return
      }
      const res = await api.get<DiagnosisStatus>(`/api/listings/${listingId}/diagnosis/${jobId}`)
      if (!res.success || !res.data) {
        setState({ phase: 'error', message: res.error?.message || 'Erro ao consultar o diagnóstico' })
        return
      }
      const s = res.data
      if (s.status === 'done') return setState({ phase: 'done', diagnosis: s.result.diagnosis })
      if (s.status === 'failed') return setState({ phase: 'error', message: s.reason })
      timer.current = setTimeout(() => poll(jobId, tentativa + 1), POLL_MS)
    },
    [listingId]
  )

  const diagnose = useCallback(async () => {
    setState({ phase: 'loading' })
    const res = await api.post<{ jobId: string }>(`/api/listings/${listingId}/diagnosis`, {})
    if (!res.success || !res.data) {
      setState({ phase: 'error', message: res.error?.message || 'Não foi possível iniciar o diagnóstico' })
      return
    }
    poll(res.data.jobId, 1)
  }, [listingId, poll])

  return { state, diagnose }
}
