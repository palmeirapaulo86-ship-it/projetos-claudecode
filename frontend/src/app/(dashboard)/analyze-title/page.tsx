'use client'

import { useState } from 'react'
import { Sparkles, AlertCircle } from 'lucide-react'
import { useTitleAnalysis } from '@/hooks/useTitleAnalysis'
import { TitleAnalysisCard } from '@/components/features/TitleAnalysisCard'
import { TitleAnalysisSkeleton } from '@/components/features/TitleAnalysisSkeleton'

// MVP da Feature 1: cola um título de um anúncio e recebe o score + sugestões.
// O listingId vem da query (?listingId=...); usa um placeholder enquanto a tela de anúncios não existe.
export default function AnalyzeTitlePage() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  // Enquanto a importação de anúncios não está pronta, usa um id de demonstração.
  const listingId = 'demo'
  const { state, analyze } = useTitleAnalysis(listingId)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (title.trim().length === 0) return
    analyze({ title: title.trim(), category: category.trim() || undefined })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Análise de Título</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Cole o título do seu anúncio e a IA dá um score de 0 a 100 com sugestões.
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título atual</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Ex: Fone de Ouvido Bluetooth Sem Fio JBL Original"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-xs text-slate-400 mt-1">{title.length}/200 caracteres</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Categoria <span className="text-slate-400">(opcional)</span>
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={120}
            placeholder="Ex: Eletrônicos, Áudio"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={state.phase === 'loading' || title.trim().length === 0}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          {state.phase === 'loading' ? 'Analisando...' : 'Analisar título'}
        </button>
      </form>

      {/* Estados de resultado */}
      {state.phase === 'loading' && <TitleAnalysisSkeleton />}

      {state.phase === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Não foi possível analisar</p>
            <p className="text-sm text-red-600 mt-0.5">{state.message}</p>
          </div>
        </div>
      )}

      {state.phase === 'done' && <TitleAnalysisCard output={state.output} />}
    </div>
  )
}
