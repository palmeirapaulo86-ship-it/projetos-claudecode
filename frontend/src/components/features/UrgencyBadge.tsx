interface UrgencyBadgeProps {
  urgencia: 'baixa' | 'media' | 'alta'
}

const config: Record<string, { cor: string; texto: string }> = {
  alta: { cor: 'bg-red-100 text-red-700', texto: 'Urgência alta' },
  media: { cor: 'bg-amber-100 text-amber-700', texto: 'Urgência média' },
  baixa: { cor: 'bg-green-100 text-green-700', texto: 'Urgência baixa' },
}

// Badge colorido de urgência do diagnóstico.
export function UrgencyBadge({ urgencia }: UrgencyBadgeProps) {
  const c = config[urgencia] ?? config.baixa
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.cor}`}>
      {c.texto}
    </span>
  )
}
