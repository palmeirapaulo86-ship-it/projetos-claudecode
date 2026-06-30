'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CompetitorsView, PricePoint, Alert } from '@/types'

// Lista de concorrentes + comparação de preço (refetch a cada 60s para refletir coletas)
export function useCompetitors(listingId: string) {
  return useQuery({
    queryKey: ['competitors', listingId],
    queryFn: async () => {
      const res = await api.get<CompetitorsView>(`/api/listings/${listingId}/competitors`)
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Erro ao carregar concorrentes')
      return res.data
    },
    refetchInterval: 60_000,
  })
}

// Histórico de preço das últimas N horas de um concorrente
export function usePriceHistory(competitorId: string | null, hours = 24) {
  return useQuery({
    queryKey: ['price-history', competitorId, hours],
    enabled: competitorId !== null,
    queryFn: async () => {
      const res = await api.get<PricePoint[]>(
        `/api/competitors/${competitorId}/price-history?hours=${hours}`
      )
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Erro ao carregar histórico')
      return res.data
    },
  })
}

// Adiciona um concorrente a monitorar
export function useAddCompetitor(listingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (url: string) => {
      const res = await api.post<{ jobId: string; externalId: string }>(
        `/api/listings/${listingId}/competitors`,
        { url }
      )
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Não foi possível adicionar')
      return res.data
    },
    onSuccess: () => {
      // Concorrente novo aparece após a coleta; revalida em alguns segundos
      setTimeout(() => qc.invalidateQueries({ queryKey: ['competitors', listingId] }), 5000)
    },
  })
}

export function useAlerts(listingId: string) {
  return useQuery({
    queryKey: ['alerts', listingId],
    queryFn: async () => {
      const res = await api.get<Alert[]>(`/api/listings/${listingId}/alerts`)
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Erro ao carregar alertas')
      return res.data
    },
  })
}

export function useCreateAlert(listingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { type: 'price_drop' | 'buy_box_lost'; config?: Record<string, unknown> }) => {
      const res = await api.post<Alert>(`/api/listings/${listingId}/alerts`, body)
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Não foi possível criar o alerta')
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts', listingId] }),
  })
}
