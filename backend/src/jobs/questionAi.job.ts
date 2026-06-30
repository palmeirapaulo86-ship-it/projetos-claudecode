import { aiAnalysisQueue } from '../lib/bull'
import { logger } from '../lib/logger'
import { sugerirRespostaPergunta } from '../services/ai/questionAnswer.pipeline'
import { salvarSugestaoIA, marcarRespondida } from '../repositories/question.repository'
import { regrasDeAutoRespostaIA, incrementarUso } from '../repositories/autoReply.repository'
import { getMlCredentials } from '../integrations/mercadolivre/mlCredentials'
import { responderPerguntaML } from '../integrations/mercadolivre/mlApiClient'

const JOB_NAME = 'suggest-answer'

// Confiança mínima para auto-envio sem revisão humana (mitiga risco de resposta errada).
const CONFIANCA_AUTO_ENVIO = 0.9

export interface SuggestAnswerJobData {
  questionId: string
  tenantId: string
  externalId: string // ID da pergunta no ML (para enviar a resposta)
  questionText: string
  title: string
  description: string
}

export async function enfileirarSugestaoResposta(data: SuggestAnswerJobData): Promise<string> {
  const job = await aiAnalysisQueue.add(JOB_NAME, data, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    timeout: 60_000,
    removeOnComplete: 200,
    removeOnFail: 50,
  })
  return job.id.toString()
}

// Decide se a resposta pode ser enviada automaticamente:
// só com regra de IA ativa + confiança alta + sem flag de revisão humana.
function podeAutoEnviar(temRegraIA: boolean, confianca: number, requerRevisao: boolean): boolean {
  return temRegraIA && confianca >= CONFIANCA_AUTO_ENVIO && !requerRevisao
}

export function registrarWorkerSugestaoResposta() {
  aiAnalysisQueue.process(JOB_NAME, async (job) => {
    const data = job.data as SuggestAnswerJobData
    logger.info('Sugerindo resposta para pergunta', { questionId: data.questionId })

    const output = await sugerirRespostaPergunta({
      questionText: data.questionText,
      title: data.title,
      description: data.description,
    })

    await salvarSugestaoIA({
      questionId: data.questionId,
      suggestedAnswer: output.resposta,
      confidence: output.confianca,
      needsReview: output.requer_revisao_humana,
    })

    // Auto-envio opcional e conservador
    const regras = await regrasDeAutoRespostaIA(data.tenantId)
    if (podeAutoEnviar(regras.length > 0, output.confianca, output.requer_revisao_humana)) {
      const cred = await getMlCredentials(data.tenantId)
      if (cred) {
        await responderPerguntaML(cred.accessToken, data.externalId, output.resposta)
        await marcarRespondida({
          questionId: data.questionId,
          answerText: output.resposta,
          answeredBy: 'ai_auto',
        })
        await incrementarUso(regras[0].id)
        logger.info('Pergunta respondida automaticamente pela IA', { questionId: data.questionId })
      }
    }

    return { confianca: output.confianca, requerRevisao: output.requer_revisao_humana }
  })

  logger.info('Worker de sugestão de resposta registrado')
}
