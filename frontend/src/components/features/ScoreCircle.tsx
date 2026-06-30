interface ScoreCircleProps {
  score: number // 0-100
}

// Círculo de score colorido: verde (bom), âmbar (médio), vermelho (ruim).
// Usa SVG com stroke-dashoffset para o anel de progresso.
export function ScoreCircle({ score }: ScoreCircleProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  const cor =
    clamped >= 70 ? 'text-green-600' : clamped >= 40 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="relative w-32 h-32" role="img" aria-label={`Score ${clamped} de 100`}>
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-200" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${cor} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${cor}`}>{clamped}</span>
        <span className="text-xs text-slate-400">de 100</span>
      </div>
    </div>
  )
}
