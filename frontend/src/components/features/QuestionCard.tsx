'use client'

import { useState } from 'react'
import { Check, Pencil, Send, X, MessageCircleQuestion, Loader2, AlertTriangle } from 'lucide-react'
import { ConfidenceBadge } from './ConfidenceBadge'
import { useApproveAnswer, useSendAnswer } from '@/hooks/useQuestions'
import type { Question } from '@/types'

interface QuestionCardProps {
  question: Question
}

const num = (v: string | number | null): number | null =>
  v === null ? null : typeof v === 'string' ? Number(v) : v

// Card de uma pergunta pendente: mostra a sugestão da IA com aprovar/editar.
export function QuestionCard({ question }: QuestionCardProps) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(question.suggestedAnswer ?? '')
  const approve = useApproveAnswer()
  const send = useSendAnswer()

  const carregando = approve.isPending || send.isPending
  const erro = (approve.error as Error)?.message || (send.error as Error)?.message
  const confianca = num(question.aiConfidence)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      {/* Pergunta do comprador */}
      <div className="flex items-start gap-2">
        <MessageCircleQuestion className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-slate-800 font-medium">{question.questionText}</p>
      </div>

      {/* Sugestão da IA */}
      <div className="pl-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Resposta sugerida pela IA</span>
          <ConfidenceBadge confidence={confianca} needsReview={question.aiNeedsReview} />
        </div>

        {question.aiNeedsReview && (
          <div className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            A IA recomenda revisão humana antes de enviar.
          </div>
        )}

        {editando ? (
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        ) : (
          <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
            {question.suggestedAnswer ?? '—'}
          </p>
        )}

        {erro && <p className="text-xs text-red-600">{erro}</p>}

        {/* Ações */}
        <div className="flex gap-2 pt-1">
          {editando ? (
            <>
              <button
                onClick={() => send.mutate({ questionId: question.id, text: texto })}
                disabled={carregando || texto.trim().length === 0}
                className="flex items-center gap-1.5 bg-primary text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {send.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Enviar resposta
              </button>
              <button
                onClick={() => { setEditando(false); setTexto(question.suggestedAnswer ?? '') }}
                disabled={carregando}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => approve.mutate(question.id)}
                disabled={carregando || !question.suggestedAnswer}
                className="flex items-center gap-1.5 bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {approve.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Aprovar e enviar
              </button>
              <button
                onClick={() => setEditando(true)}
                disabled={carregando}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
