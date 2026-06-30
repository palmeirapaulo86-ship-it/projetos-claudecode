import { aiAnalysisQueue } from '../lib/bull'
import { logger } from '../lib/logger'
import { analisarTitulo } from '../services/ai/titleAnalysis.pipeline'
import { salvarAnaliseDeTitulo } from '../repositories/listingAnalysis.repository'
import type { AnalyzeTitleInput, TitleAnalysisOutput } from '../validations/titleAnalysis.validation'

const JOB_NAME = 'analyze-title'

export interface AnalyzeTitleJobData extends AnalyzeTitleInput {
  tenantId: string
  listingId: string
}

export interface AnalyzeTitleJobResult {
  analysisId: string
  output: TitleAnalysisOutput
}

// Enfileira a análise — apenas enfileirar, nunca processar aqui (regra do backend/ai-engine).
export async function enfileirarAnaliseDeTitulo(data: AnalyzeTitleJobData): Promise<string> {
  const job = await aiAnalysisQueue.add(JOB_NAME, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    timeout: 60_000,
    removeOnComplete: 100, // mantém os últimos 100 resultados para o polling do frontend
    removeOnFail: 50,
  })
  return job.id.toString()
}

// Worker: processa a fila, persiste e retorna o resultado (disponível via getJob para polling).
export function registrarWorkerAnaliseDeTitulo() {
  aiAnalysisQueue.process(JOB_NAME, async (job): Promise<AnalyzeTitleJobResult> => {
    const data = job.data as AnalyzeTitleJobData
    logger.info('Processando análise de título', { jobId: job.id, listingId: data.listingId })

    const { output, rawResponse } = await analisarTitulo(data)

    const analise = await salvarAnaliseDeTitulo({
      tenantId: data.tenantId,
      listingId: data.listingId,
      output,
      rawResponse,
    })

    return { analysisId: analise.id, output }
  })

  logger.info('Worker de análise de título registrado')
}
