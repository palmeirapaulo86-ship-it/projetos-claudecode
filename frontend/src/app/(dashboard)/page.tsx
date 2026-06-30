import { BarChart2, TrendingUp, MessageSquare, AlertTriangle } from 'lucide-react'

const statCards = [
  {
    label: 'Anúncios Ativos',
    value: '—',
    icon: BarChart2,
    description: 'Total de anúncios monitorados',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    label: 'Score Médio de Título',
    value: '—',
    icon: TrendingUp,
    description: 'Média de qualidade dos títulos',
    color: 'text-green-600 bg-green-50',
  },
  {
    label: 'Perguntas Pendentes',
    value: '—',
    icon: MessageSquare,
    description: 'Aguardando resposta',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    label: 'Alertas Ativos',
    value: '—',
    icon: AlertTriangle,
    description: 'Monitoramentos configurados',
    color: 'text-red-600 bg-red-50',
  },
]

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Visão Geral</h1>
        <p className="text-sm text-slate-500 mt-0.5">Acompanhe o desempenho dos seus anúncios</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, description, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">{label}</span>
              <div className={`p-1.5 rounded-lg ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          </div>
        ))}
      </div>

      {/* Estado vazio — primeiros passos */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-slate-700">Comece conectando seus anúncios</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
          Vá em <strong>Meus Anúncios</strong> para importar seus anúncios do Mercado Livre e começar a usar o Copilot.
        </p>
      </div>
    </div>
  )
}
