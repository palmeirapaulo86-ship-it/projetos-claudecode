'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-slate-600">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <p className="font-medium text-slate-800">Algo deu errado</p>
          <p className="text-sm text-center">Recarregue a página ou entre em contato com o suporte.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-sm text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
