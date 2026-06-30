import { AlertTriangle, Lightbulb, Sparkles, Copy } from 'lucide-react'
import { ScoreCircle } from './ScoreCircle'
import type { TitleAnalysisOutput } from '@/types'

interface TitleAnalysisCardProps {
  output: TitleAnalysisOutput
}

// Card de resultado da análise: score visual + problemas + sugestões + títulos alternativos.
export function TitleAnalysisCard({ output }: TitleAnalysisCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      {/* Cabeçalho com o score */}
      <div className="flex items-center gap-6">
        <ScoreCircle score={output.score} />
        <div>
          <h3 className="text-base font-semibold text-slate-800">Qualidade do título</h3>
          <p className="text-sm text-slate-500 mt-1">
            {output.score >= 70
              ? 'Bom título — pequenos ajustes podem melhorar ainda mais.'
              : output.score >= 40
                ? 'Título mediano — há ganhos claros de conversão a fazer.'
                : 'Título fraco — priorize a otimização para não perder vendas.'}
          </p>
        </div>
      </div>

      {/* Problemas encontrados */}
      {output.problemas.length > 0 && (
        <section>
          <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Problemas encontrados
          </h4>
          <ul className="space-y-1.5">
            {output.problemas.map((p, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sugestões */}
      {output.sugestoes.length > 0 && (
        <section>
          <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            Sugestões de melhoria
          </h4>
          <ul className="space-y-1.5">
            {output.sugestoes.map((s, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Títulos alternativos gerados pela IA */}
      {output.titulos_alternativos.length > 0 && (
        <section>
          <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Títulos sugeridos pela IA
          </h4>
          <div className="space-y-2">
            {output.titulos_alternativos.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
              >
                <span className="text-sm text-slate-700">{t}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(t)}
                  className="text-slate-400 hover:text-primary transition-colors flex-shrink-0"
                  title="Copiar título"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
