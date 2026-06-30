'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import {
  BarChart2,
  TrendingDown,
  MessageSquare,
  DollarSign,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

const navItems = [
  { href: '/dashboard', label: 'Visão Geral', icon: BarChart2 },
  { href: '/analyze-title', label: 'Análise de Título', icon: Sparkles },
  { href: '/price-monitor', label: 'Monitor de Preço', icon: TrendingDown },
  { href: '/dashboard/listings', label: 'Meus Anúncios', icon: TrendingDown },
  { href: '/dashboard/questions', label: 'Perguntas', icon: MessageSquare },
  { href: '/dashboard/profitability', label: 'Rentabilidade', icon: DollarSign },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, clearAuth } = useAuthStore()

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-slate-100">
          <h1 className="text-base font-bold text-slate-900">Marketplace</h1>
          <p className="text-xs text-slate-500">Copilot</p>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-blue-50 text-primary'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Usuário + logout */}
        <div className="px-4 py-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-800 truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 truncate mb-3">{user?.email}</p>
          <button
            onClick={() => { clearAuth(); router.push('/login') }}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  )
}
