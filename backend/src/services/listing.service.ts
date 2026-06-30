import { aiAnalysisQueue } from '../lib/bull'
import { listingPertenceAoTenant } from '../repositories/listingAnalysis.repository'
import { enfileirarAnaliseDeTitulo, type AnalyzeTitleJobResult } from '../jobs/titleAnalysis.job'
import type { AnalyzeTitleInput } from '../validations/titleAnalysis.validation'

export class ListingNaoEncontradoError extends Error {
  constructor() {
    super('Anúncio não encontrado')
    this.name = 'ListingNaoEncontradoError'
  }
}

// Valida posse do anúncio e enfileira a análise. Retorna o jobId para o cliente acompanhar.
export async function solicitarAnaliseDeTitulo(
  listingId: string,
  tenantId: string,
  input: AnalyzeTitleInput
): Promise<{ jobId: string }> {
  const pertence = await listingPertenceAoTenant(listingId, tenantId)
  if (!pertence) {
    throw new ListingNaoEncontradoError()
  }

  const jobId = await enfileirarAnaliseDeTitulo({ ...input, tenantId, listingId })
  return { jobId }
}

export type StatusAnalise =
  | { status: 'pending' }
  | { status: 'processing' }
  | { status: 'failed'; reason: string }
  | { status: 'done'; result: AnalyzeTitleJobResult }

// Consulta o status/resultado de um job, garantindo que pertence ao tenant (anti-vazamento).
export async function consultarStatusAnalise(
  jobId: string,
  listingId: string,
  tenantId: string
): Promise<StatusAnalise | null> {
  const job = await aiAnalysisQueue.getJob(jobId)
  if (!job) return null

  // Bloqueia acesso a job de outro tenant ou de outro anúncio
  const data = job.data as { tenantId: string; listingId: string }
  if (data.tenantId !== tenantId || data.listingId !== listingId) return null

  const state = await job.getState()

  if (state === 'completed') {
    return { status: 'done', result: job.returnvalue as AnalyzeTitleJobResult }
  }
  if (state === 'failed') {
    return { status: 'failed', reason: job.failedReason || 'Falha ao processar a análise' }
  }
  if (state === 'active') {
    return { status: 'processing' }
  }
  return { status: 'pending' }
}
