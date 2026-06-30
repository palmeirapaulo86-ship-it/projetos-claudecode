export interface ApiResponse<T = unknown> {
  success: boolean
  data: T | null
  error: { code: string; message: string } | null
  meta: { timestamp: string; version: string }
}

export interface User {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'member'
  tenantId: string
}

export interface Tenant {
  id: string
  name: string
  email: string
  plan: 'starter' | 'pro' | 'enterprise'
}

export interface Listing {
  id: string
  tenantId: string
  externalId: string
  platform: 'mercadolivre' | 'amazon' | 'shopee'
  title: string
  price: number
  stock: number
  titleScore: number | null
  salesLast30Days: number
  lastAnalyzedAt: string | null
}

export interface TitleAnalysisOutput {
  score: number
  problemas: string[]
  sugestoes: string[]
  titulos_alternativos: string[]
}

// Estados retornados pelo polling do job de análise
export type AnalysisStatus =
  | { status: 'pending' }
  | { status: 'processing' }
  | { status: 'failed'; reason: string }
  | { status: 'done'; result: { analysisId: string; output: TitleAnalysisOutput } }
