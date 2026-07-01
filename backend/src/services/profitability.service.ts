import { ListingNaoEncontradoError } from './listing.service'
import { listingPertenceAoTenant } from '../repositories/listingAnalysis.repository'
import {
  upsertCustos,
  listingComCustos,
  listingsComCustos,
  criarSnapshot,
  historicoMargem,
} from '../repositories/profitability.repository'
import { calcularRentabilidade } from './profitability.calc'
import { aiAnalysisQueue } from '../lib/bull'
import {
  enfileirarAnaliseRentabilidade,
  type ProfitabilityJobResult,
} from '../jobs/profitabilityAi.job'
import type { UpsertCostInput } from '../validations/profitability.validation'

export class CustosNaoCadastradosError extends Error {
  constructor() {
    super('Custos ainda não cadastrados para este anúncio')
    this.name = 'CustosNaoCadastradosError'
  }
}

// Cadastra custos, calcula a rentabilidade e grava um snapshot para o gráfico.
export async function cadastrarCustos(listingId: string, tenantId: string, input: UpsertCostInput) {
  if (!(await listingPertenceAoTenant(listingId, tenantId))) {
    throw new ListingNaoEncontradoError()
  }
  await upsertCustos(tenantId, listingId, input)

  const custos = await listingComCustos(listingId, tenantId)
  if (!custos) throw new CustosNaoCadastradosError()

  const result = calcularRentabilidade(custos)
  await criarSnapshot({
    tenantId,
    listingId,
    netProfit: result.netProfit,
    marginPercent: result.marginPercent,
  })
  return result
}

// Rentabilidade de um produto + histórico de margem (sem IA — números instantâneos).
export async function obterRentabilidade(listingId: string, tenantId: string, dias = 90) {
  if (!(await listingPertenceAoTenant(listingId, tenantId))) {
    throw new ListingNaoEncontradoError()
  }
  const custos = await listingComCustos(listingId, tenantId)
  if (!custos) throw new CustosNaoCadastradosError()

  const result = calcularRentabilidade(custos)
  const historico = await historicoMargem(listingId, tenantId, dias)
  return {
    title: custos.title,
    ...result,
    history: historico.map((h) => ({
      netProfit: Number(h.netProfit),
      marginPercent: Number(h.marginPercent),
      capturedAt: h.capturedAt,
    })),
  }
}

// Lista todos os produtos com custos, ordenados por margem (prejuízo primeiro).
export async function listarRentabilidades(tenantId: string) {
  const produtos = await listingsComCustos(tenantId)
  return produtos
    .map((p) => {
      const r = calcularRentabilidade(p)
      return {
        listingId: p.listingId,
        title: p.title,
        price: r.price,
        netProfit: r.netProfit,
        marginPercent: r.marginPercent,
        breakEvenPrice: r.breakEvenPrice,
        isLoss: r.isLoss,
      }
    })
    .sort((a, b) => a.marginPercent - b.marginPercent)
}

// Enfileira a análise da IA
export async function solicitarAnaliseIA(listingId: string, tenantId: string) {
  if (!(await listingPertenceAoTenant(listingId, tenantId))) {
    throw new ListingNaoEncontradoError()
  }
  if (!(await listingComCustos(listingId, tenantId))) {
    throw new CustosNaoCadastradosError()
  }
  const jobId = await enfileirarAnaliseRentabilidade({ tenantId, listingId })
  return { jobId }
}

export type StatusAnaliseRent =
  | { status: 'pending' }
  | { status: 'processing' }
  | { status: 'failed'; reason: string }
  | { status: 'done'; result: ProfitabilityJobResult }

// Polling do resultado da IA, com checagem de posse do job.
export async function consultarAnaliseIA(
  jobId: string,
  listingId: string,
  tenantId: string
): Promise<StatusAnaliseRent | null> {
  const job = await aiAnalysisQueue.getJob(jobId)
  if (!job) return null
  const data = job.data as { tenantId: string; listingId: string }
  if (data.tenantId !== tenantId || data.listingId !== listingId) return null

  const state = await job.getState()
  if (state === 'completed') return { status: 'done', result: job.returnvalue as ProfitabilityJobResult }
  if (state === 'failed') return { status: 'failed', reason: job.failedReason || 'Falha na análise' }
  if (state === 'active') return { status: 'processing' }
  return { status: 'pending' }
}
