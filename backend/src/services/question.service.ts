import { ListingNaoEncontradoError } from './listing.service'
import { listingPertenceAoTenant } from '../repositories/listingAnalysis.repository'
import {
  listarPerguntas,
  acharPergunta,
  marcarRespondida,
} from '../repositories/question.repository'
import { criarAutoReply, listarAutoReplies } from '../repositories/autoReply.repository'
import { getMlCredentials } from '../integrations/mercadolivre/mlCredentials'
import { responderPerguntaML } from '../integrations/mercadolivre/mlApiClient'
import type { CreateAutoReplyInput } from '../validations/question.validation'

export class PerguntaNaoEncontradaError extends Error {
  constructor() {
    super('Pergunta não encontrada')
    this.name = 'PerguntaNaoEncontradaError'
  }
}
export class MlNaoConectadoError extends Error {
  constructor() {
    super('Mercado Livre não conectado para esta conta')
    this.name = 'MlNaoConectadoError'
  }
}
export class PerguntaJaRespondidaError extends Error {
  constructor() {
    super('Esta pergunta já foi respondida')
    this.name = 'PerguntaJaRespondidaError'
  }
}

export function listarPerguntasDoTenant(tenantId: string, status?: string) {
  return listarPerguntas(tenantId, status)
}

// Envia uma resposta (a sugerida ou uma editada) via API do ML e marca como respondida.
export async function responderPergunta(
  questionId: string,
  tenantId: string,
  text: string,
  origem: 'ai_suggested' | 'manual'
) {
  const pergunta = await acharPergunta(questionId, tenantId)
  if (!pergunta) throw new PerguntaNaoEncontradaError()
  if (pergunta.status === 'answered') throw new PerguntaJaRespondidaError()

  const cred = await getMlCredentials(tenantId)
  if (!cred) throw new MlNaoConectadoError()

  await responderPerguntaML(cred.accessToken, pergunta.externalId, text)
  return marcarRespondida({ questionId, answerText: text, answeredBy: origem })
}

// Aprovar = enviar exatamente a resposta sugerida pela IA
export async function aprovarSugestao(questionId: string, tenantId: string) {
  const pergunta = await acharPergunta(questionId, tenantId)
  if (!pergunta) throw new PerguntaNaoEncontradaError()
  if (!pergunta.suggestedAnswer) throw new PerguntaNaoEncontradaError()
  return responderPergunta(questionId, tenantId, pergunta.suggestedAnswer, 'ai_suggested')
}

export async function configurarAutoReply(
  listingId: string,
  tenantId: string,
  input: CreateAutoReplyInput
) {
  if (!(await listingPertenceAoTenant(listingId, tenantId))) {
    throw new ListingNaoEncontradoError()
  }
  return criarAutoReply({
    tenantId,
    keyword: input.keyword,
    response: input.response,
    useAi: input.useAi,
  })
}

export function listarAutoRepliesDoTenant(tenantId: string) {
  return listarAutoReplies(tenantId)
}
