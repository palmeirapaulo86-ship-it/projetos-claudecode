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

// ----- Feature 2: Monitor de Preço -----
export interface Competitor {
  id: string
  sellerName: string
  title: string
  price: number
  stock: number | null
  hasBuyBox: boolean
  updatedAt: string
}

export interface CompetitorsView {
  precoProprio: number | null
  menorPrecoConcorrente: number | null
  acimaDaConcorrencia: boolean
  competitors: Competitor[]
}

export interface PricePoint {
  price: number
  hasBuyBox: boolean
  capturedAt: string
}

export interface Alert {
  id: string
  type: 'price_drop' | 'buy_box_lost'
  config: Record<string, unknown>
  isActive: boolean
  lastFiredAt: string | null
  createdAt: string
}

// ----- Feature 4: Rentabilidade -----
export interface ProfitabilityRow {
  listingId: string
  title: string
  price: number
  netProfit: number
  marginPercent: number
  breakEvenPrice: number
  isLoss: boolean
}

export interface ProfitabilityDetail {
  title: string
  price: number
  platformFeeValue: number
  returnLossValue: number
  totalCost: number
  netProfit: number
  marginPercent: number
  breakEvenPrice: number
  isLoss: boolean
  history: { netProfit: number; marginPercent: number; capturedAt: string }[]
}

export interface ProfitabilityAiOutput {
  analise: string
  recomendacao: string
  urgencia: 'baixa' | 'media' | 'alta'
}

export type ProfitAnalysisStatus =
  | { status: 'pending' }
  | { status: 'processing' }
  | { status: 'failed'; reason: string }
  | { status: 'done'; result: { result: ProfitabilityDetail; ai: ProfitabilityAiOutput } }

// ----- Feature 3: Resposta Automática de Perguntas -----
export interface Question {
  id: string
  listingId: string
  externalId: string
  buyerName: string | null
  questionText: string
  answerText: string | null
  answeredBy: string | null // manual, ai_auto, ai_suggested
  answeredAt: string | null
  status: 'pending' | 'suggested' | 'answered'
  suggestedAnswer: string | null
  aiConfidence: string | number | null // Decimal vem como string do Prisma
  aiNeedsReview: boolean
  createdAt: string
}
