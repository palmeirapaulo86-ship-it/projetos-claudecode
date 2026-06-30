interface ConfidenceBadgeProps {
  confidence: number | null // 0-1
  needsReview: boolean
}

// Indicador visual de confiança da IA: verde (alta), âmbar (média), vermelho (baixa/revisão).
export function ConfidenceBadge({ confidence, needsReview }: ConfidenceBadgeProps) {
  if (confidence === null) {
    return <span className="text-xs text-slate-400">Sugerindo...</span>
  }
  const pct = Math.round(confidence * 100)

  // Revisão necessária sempre aparece como alerta, independente do número
  const { cor, texto } = needsReview
    ? { cor: 'bg-red-50 text-red-700', texto: 'Revisar' }
    : confidence >= 0.8
      ? { cor: 'bg-green-50 text-green-700', texto: 'Alta confiança' }
      : confidence >= 0.5
        ? { cor: 'bg-amber-50 text-amber-700', texto: 'Confiança média' }
        : { cor: 'bg-red-50 text-red-700', texto: 'Baixa confiança' }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cor}`}>
      {texto} · {pct}%
    </span>
  )
}
