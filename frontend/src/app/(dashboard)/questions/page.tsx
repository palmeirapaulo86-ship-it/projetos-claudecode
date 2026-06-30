'use client'

import { useState } from 'react'
import { Inbox, CheckCircle2, MessageSquare } from 'lucide-react'
import { useQuestions } from '@/hooks/useQuestions'
import { QuestionCard } from '@/components/features/QuestionCard'
import { CardSkeleton } from '@/components/shared/Skeleton'
import type { Question } from '@/types'

type Aba = 'pending' | 'answered'

const origemLabel: Record<string, string> = {
  ai_auto: 'IA (automático)',
  ai_suggested: 'IA (aprovado)',
  manual: 'Manual',
}

export default function QuestionsPage() {
  const [aba, setAba] = useState<Aba>('pending')
  // "Pendentes" reúne perguntas aguardando coleta/sugestão e as já sugeridas
  const pendentes = useQuestions('suggested')
  const respondidas = useQuestions('answered')

  const lista: Question[] = aba === 'pending' ? pendentes.data ?? [] : respondidas.data ?? []
  const carregando = aba === 'pending' ? pendentes.isLoading : respondidas.isLoading
  const erro = aba === 'pending' ? pendentes.isError : respondidas.isError

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Perguntas</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          A IA sugere respostas usando o título e a descrição do produto. Aprove, edite ou deixe no automático.
        </p>
      </div>

      {/* Abas: fila de pendentes / histórico */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setAba('pending')}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            aba === 'pending' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Pendentes
          {pendentes.data && pendentes.data.length > 0 && (
            <span className="ml-1 bg-primary text-white text-xs rounded-full px-1.5 py-0.5">
              {pendentes.data.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAba('answered')}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            aba === 'answered' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Respondidas
        </button>
      </div>

      {/* Conteúdo */}
      {carregando ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : erro ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          Não foi possível carregar as perguntas.
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">
            {aba === 'pending' ? 'Nenhuma pergunta pendente' : 'Nenhuma pergunta respondida ainda'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {aba === 'pending'
              ? 'Perguntas novas do Mercado Livre aparecem aqui a cada 5 minutos.'
              : 'As perguntas que você responder aparecerão neste histórico.'}
          </p>
        </div>
      ) : aba === 'pending' ? (
        <div className="space-y-3">
          {lista.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      ) : (
        // Histórico: pergunta + resposta enviada + origem
        <div className="space-y-3">
          {lista.map((q) => (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <p className="text-sm font-medium text-slate-800">{q.questionText}</p>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{q.answerText}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                Respondida{q.answeredBy ? ` · ${origemLabel[q.answeredBy] ?? q.answeredBy}` : ''}
                {q.answeredAt ? ` · ${new Date(q.answeredAt).toLocaleString('pt-BR')}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
