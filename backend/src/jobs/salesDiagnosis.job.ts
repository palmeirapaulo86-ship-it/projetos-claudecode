import { aiAnalysisQueue } from '../lib/bull'
import { logger } from '../lib/logger'
import { diagnosticarQueda } from '../services/ai/salesDiagnosis.pipeline'
import { detectarQueda, type SalesTrend } from '../services/salesTrend.calc'
import {
  vendasDoProduto,
  tituloEPreco,
  contextoConcorrencia,
} from '../repositories/salesDrop.repository'
import type { SalesDiagnosisOutput } from '../validations/salesDrop.validation'

const JOB_NAME = 'diagnose-sales'

export interface SalesDiagnosisJobData {
  tenantId: string
  listingId: string
}

export interface SalesDiagnosisJobResult {
  trend: SalesTrend
  diagnosis: SalesDiagnosisOutput
}

export async function enfileirarDiagnosticoVendas(data: SalesDiagnosisJobData): Promise<string> {
  const job = await aiAnalysisQueue.add(JOB_NAME, data, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    timeout: 60_000,
    removeOnComplete: 100,
    removeOnFail: 50,
  })
  return job.id.toString()
}

export function registrarWorkerDiagnosticoVendas() {
  aiAnalysisQueue.process(JOB_NAME, async (job): Promise<SalesDiagnosisJobResult> => {
    const data = job.data as SalesDiagnosisJobData
    const info = await tituloEPreco(data.listingId, data.tenantId)
    if (!info) throw new Error('Anúncio não encontrado')

    const sales = await vendasDoProduto(data.listingId, data.tenantId, 90)
    const trend = detectarQueda(sales, new Date()) // detecção em código
    const contexto = await contextoConcorrencia(data.listingId, data.tenantId, info.price)

    const diagnosis = await diagnosticarQueda({
      title: info.title,
      trend,
      precoAtual: info.price,
      ...contexto,
    })

    logger.info('Diagnóstico de vendas concluído', {
      listingId: data.listingId,
      declinePercent: trend.declinePercent,
    })
    return { trend, diagnosis }
  })

  logger.info('Worker de diagnóstico de vendas registrado')
}
