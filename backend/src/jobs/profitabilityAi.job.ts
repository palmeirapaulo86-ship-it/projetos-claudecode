import { aiAnalysisQueue } from '../lib/bull'
import { logger } from '../lib/logger'
import { analisarRentabilidade } from '../services/ai/profitability.pipeline'
import { calcularRentabilidade, type ProfitabilityResult } from '../services/profitability.calc'
import { listingComCustos } from '../repositories/profitability.repository'
import type { ProfitabilityAiOutput } from '../validations/profitability.validation'

const JOB_NAME = 'analyze-profitability'

export interface ProfitabilityJobData {
  tenantId: string
  listingId: string
}

export interface ProfitabilityJobResult {
  result: ProfitabilityResult
  ai: ProfitabilityAiOutput
}

// Enfileira a geração da análise/recomendação (IA nunca síncrona).
export async function enfileirarAnaliseRentabilidade(data: ProfitabilityJobData): Promise<string> {
  const job = await aiAnalysisQueue.add(JOB_NAME, data, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    timeout: 60_000,
    removeOnComplete: 100,
    removeOnFail: 50,
  })
  return job.id.toString()
}

export function registrarWorkerRentabilidade() {
  aiAnalysisQueue.process(JOB_NAME, async (job): Promise<ProfitabilityJobResult> => {
    const data = job.data as ProfitabilityJobData
    const custos = await listingComCustos(data.listingId, data.tenantId)
    if (!custos) throw new Error('Custos não cadastrados para este anúncio')

    // Números calculados em código; IA só interpreta
    const result = calcularRentabilidade(custos)
    const ai = await analisarRentabilidade(custos.title, result)

    logger.info('Análise de rentabilidade concluída', { listingId: data.listingId, isLoss: result.isLoss })
    return { result, ai }
  })

  logger.info('Worker de rentabilidade registrado')
}
