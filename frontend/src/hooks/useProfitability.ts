'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useRef, useEffect } from 'react'
import { api } from '@/lib/api'
import type {
  ProfitabilityRow,
  ProfitabilityDetail,
  ProfitAnalysisStatus,
  ProfitabilityAiOutput,
} from '@/types'

// Lista todos os produtos ordenados por margem (prejuízo primeiro)
export function useProfitabilityList() {
  return useQuery({
    queryKey: ['profitability-list'],
    queryFn: async () => {
      const res = await api.get<ProfitabilityRow[]>('/api/profitability')
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Erro ao carregar rentabilidade')
      return res.data
    },
  })
}

// Rentabilidade + histórico de um produto
export function useProfitabilityDetail(listingId: string | null) {
  return useQuery({
    queryKey: ['profitability', listingId],
    enabled: listingId !== null,
    queryFn: async () => {
      const res = await api.get<ProfitabilityDetail>(`/api/listings/${listingId}/profitability`)
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Cadastre os custos deste produto')
      return res.data
    },
    retry: false,
  })
}

// Cadastra/atualiza custos
export function useUpsertCosts(listingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      productCost: number
      shippingCost: number
      platformFeePercent: number
      returnRatePercent: number
    }) => {
      const res = await api.post<ProfitabilityDetail>(`/api/listings/${listingId}/costs`, body)
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Não foi possível salvar os custos')
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profitability', listingId] })
      qc.invalidateQueries({ queryKey: ['profitability-list'] })
    },
  })
}

type AiState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; ai: ProfitabilityAiOutput }

const POLL_MS = 2000
const MAX_TENTATIVAS = 30

// Análise da IA via fila + polling (mesmo padrão da Feature 1)
export function useProfitabilityAi(listingId: string) {
  const [state, setState] = useState<AiState>({ phase: 'idle' })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const poll = useCallback(
    async (jobId: string, tentativa: number) => {
      if (tentativa > MAX_TENTATIVAS) {
        setState({ phase: 'error', message: 'A análise demorou mais que o esperado.' })
        return
      }
      const res = await api.get<ProfitAnalysisStatus>(
        `/api/listings/${listingId}/profitability/analyze/${jobId}`
      )
      if (!res.success || !res.data) {
        setState({ phase: 'error', message: res.error?.message || 'Erro ao consultar a análise' })
        return
      }
      const s = res.data
      if (s.status === 'done') return setState({ phase: 'done', ai: s.result.ai })
      if (s.status === 'failed') return setState({ phase: 'error', message: s.reason })
      timer.current = setTimeout(() => poll(jobId, tentativa + 1), POLL_MS)
    },
    [listingId]
  )

  const analyze = useCallback(async () => {
    setState({ phase: 'loading' })
    const res = await api.post<{ jobId: string }>(`/api/listings/${listingId}/profitability/analyze`, {})
    if (!res.success || !res.data) {
      setState({ phase: 'error', message: res.error?.message || 'Não foi possível iniciar a análise' })
      return
    }
    poll(res.data.jobId, 1)
  }, [listingId, poll])

  return { state, analyze }
}
