import { ListingNaoEncontradoError } from './listing.service'
import { listingPertenceAoTenant } from '../repositories/listingAnalysis.repository'
import {
  registrarVendas as repoRegistrarVendas,
  vendasDoProduto,
  produtosComVendas,
} from '../repositories/salesDrop.repository'
import { detectarQueda } from './salesTrend.calc'
import { aiAnalysisQueue } from '../lib/bull'
import {
  enfileirarDiagnosticoVendas,
  type SalesDiagnosisJobResult,
} from '../jobs/salesDiagnosis.job'
import type { RegisterSaleInput } from '../validations/salesDrop.validation'

// Registra vendas diárias (uma ou várias) após validar posse do anúncio.
export async function registrarVendas(
  listingId: string,
  tenantId: string,
  sales: RegisterSaleInput[]
) {
  if (!(await listingPertenceAoTenant(listingId, tenantId))) {
    throw new ListingNaoEncontradoError()
  }
  await repoRegistrarVendas(tenantId, listingId, sales)
  return { registradas: sales.length }
}

// Série + tendência (detecção de queda em código) de um produto.
export async function obterTendencia(listingId: string, tenantId: string) {
  if (!(await listingPertenceAoTenant(listingId, tenantId))) {
    throw new ListingNaoEncontradoError()
  }
  const sales = await vendasDoProduto(listingId, tenantId, 90)
  const trend = detectarQueda(sales, new Date())
  return { series: sales, trend }
}

// Lista produtos com queda detectada primeiro, ordenados pela severidade.
export async function listarQuedas(tenantId: string) {
  const produtos = await produtosComVendas(tenantId)
  return produtos
    .map((p) => {
      const trend = detectarQueda(p.sales, new Date())
      return {
        listingId: p.listingId,
        title: p.title,
        price: p.price,
        unitsRecent30: trend.unitsRecent30,
        unitsPrevious30: trend.unitsPrevious30,
        declinePercent: trend.declinePercent,
        hasDrop: trend.hasDrop,
      }
    })
    .sort((a, b) => {
      // Quedas primeiro, depois maior severidade
      if (a.hasDrop !== b.hasDrop) return a.hasDrop ? -1 : 1
      return b.declinePercent - a.declinePercent
    })
}

export async function solicitarDiagnostico(listingId: string, tenantId: string) {
  if (!(await listingPertenceAoTenant(listingId, tenantId))) {
    throw new ListingNaoEncontradoError()
  }
  const jobId = await enfileirarDiagnosticoVendas({ tenantId, listingId })
  return { jobId }
}

export type StatusDiagnostico =
  | { status: 'pending' }
  | { status: 'processing' }
  | { status: 'failed'; reason: string }
  | { status: 'done'; result: SalesDiagnosisJobResult }

export async function consultarDiagnostico(
  jobId: string,
  listingId: string,
  tenantId: string
): Promise<StatusDiagnostico | null> {
  const job = await aiAnalysisQueue.getJob(jobId)
  if (!job) return null
  const data = job.data as { tenantId: string; listingId: string }
  if (data.tenantId !== tenantId || data.listingId !== listingId) return null

  const state = await job.getState()
  if (state === 'completed') return { status: 'done', result: job.returnvalue as SalesDiagnosisJobResult }
  if (state === 'failed') return { status: 'failed', reason: job.failedReason || 'Falha no diagnóstico' }
  if (state === 'active') return { status: 'processing' }
  return { status: 'pending' }
}
