'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Question } from '@/types'

// Lista perguntas por status. Refetch a cada 30s para refletir a coleta automática.
export function useQuestions(status?: string) {
  return useQuery({
    queryKey: ['questions', status ?? 'all'],
    queryFn: async () => {
      const qs = status ? `?status=${status}` : ''
      const res = await api.get<Question[]>(`/api/questions${qs}`)
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Erro ao carregar perguntas')
      return res.data
    },
    refetchInterval: 30_000,
  })
}

function invalidarTudo(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['questions'] })
}

// Aprova e envia a resposta sugerida pela IA
export function useApproveAnswer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (questionId: string) => {
      const res = await api.post<Question>(`/api/questions/${questionId}/approve`, {})
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Não foi possível aprovar')
      return res.data
    },
    onSuccess: () => invalidarTudo(qc),
  })
}

// Edita e envia a resposta manualmente
export function useSendAnswer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ questionId, text }: { questionId: string; text: string }) => {
      const res = await api.patch<Question>(`/api/questions/${questionId}`, { text })
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Não foi possível enviar')
      return res.data
    },
    onSuccess: () => invalidarTudo(qc),
  })
}
