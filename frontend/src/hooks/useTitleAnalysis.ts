'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { api } from '@/lib/api'
import type { AnalysisStatus, TitleAnalysisOutput } from '@/types'

interface AnalyzeArgs {
  title: string
  category?: string
  keywords?: string[]
}

type UiState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; output: TitleAnalysisOutput }

const POLL_INTERVAL_MS = 2000
const MAX_TENTATIVAS = 30 // ~60s de polling antes de desistir

// Hook que enfileira a análise e faz polling do resultado até concluir.
// listingId é necessário porque o endpoint é POST /api/listings/:id/analyze/title.
export function useTitleAnalysis(listingId: string) {
  const [state, setState] = useState<UiState>({ phase: 'idle' })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Limpa o polling ao desmontar para evitar update em componente desmontado
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const poll = useCallback(
    async (jobId: string, tentativa: number) => {
      if (tentativa > MAX_TENTATIVAS) {
        setState({ phase: 'error', message: 'A análise demorou mais que o esperado. Tente novamente.' })
        return
      }

      const res = await api.get<AnalysisStatus>(`/api/listings/${listingId}/analyze/title/${jobId}`)
      if (!res.success || !res.data) {
        setState({ phase: 'error', message: res.error?.message || 'Erro ao consultar a análise' })
        return
      }

      const status = res.data
      if (status.status === 'done') {
        setState({ phase: 'done', output: status.result.output })
        return
      }
      if (status.status === 'failed') {
        setState({ phase: 'error', message: status.reason })
        return
      }
      // pending | processing → reagenda
      timerRef.current = setTimeout(() => poll(jobId, tentativa + 1), POLL_INTERVAL_MS)
    },
    [listingId]
  )

  const analyze = useCallback(
    async (args: AnalyzeArgs) => {
      setState({ phase: 'loading' })
      const res = await api.post<{ jobId: string }>(
        `/api/listings/${listingId}/analyze/title`,
        args
      )
      if (!res.success || !res.data) {
        setState({ phase: 'error', message: res.error?.message || 'Não foi possível iniciar a análise' })
        return
      }
      poll(res.data.jobId, 1)
    },
    [listingId, poll]
  )

  const reset = useCallback(() => setState({ phase: 'idle' }), [])

  return { state, analyze, reset }
}
