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
