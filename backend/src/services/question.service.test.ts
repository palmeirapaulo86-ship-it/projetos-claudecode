import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../repositories/question.repository', () => ({
  listarPerguntas: vi.fn(),
  acharPergunta: vi.fn(),
  marcarRespondida: vi.fn(),
}))
vi.mock('../repositories/autoReply.repository', () => ({
  criarAutoReply: vi.fn(),
  listarAutoReplies: vi.fn(),
}))
vi.mock('../repositories/listingAnalysis.repository', () => ({ listingPertenceAoTenant: vi.fn() }))
vi.mock('../integrations/mercadolivre/mlCredentials', () => ({ getMlCredentials: vi.fn() }))
vi.mock('../integrations/mercadolivre/mlApiClient', () => ({ responderPerguntaML: vi.fn() }))

import { acharPergunta, marcarRespondida } from '../repositories/question.repository'
import { getMlCredentials } from '../integrations/mercadolivre/mlCredentials'
import { responderPerguntaML } from '../integrations/mercadolivre/mlApiClient'
import {
  responderPergunta,
  aprovarSugestao,
  PerguntaNaoEncontradaError,
  MlNaoConectadoError,
  PerguntaJaRespondidaError,
} from './question.service'

beforeEach(() => vi.clearAllMocks())

const pergunta = (over = {}) => ({
  id: 'q1',
  tenantId: 't1',
  externalId: '999',
  status: 'suggested',
  suggestedAnswer: 'Sim, enviamos para todo o Brasil.',
  ...over,
})

describe('responderPergunta', () => {
  it('envia ao ML e marca como respondida', async () => {
    vi.mocked(acharPergunta).mockResolvedValue(pergunta() as never)
    vi.mocked(getMlCredentials).mockResolvedValue({ accessToken: 'tok', sellerId: 's1' })
    vi.mocked(marcarRespondida).mockResolvedValue({ id: 'q1' } as never)

    await responderPergunta('q1', 't1', 'Resposta', 'manual')

    expect(responderPerguntaML).toHaveBeenCalledWith('tok', '999', 'Resposta')
    expect(marcarRespondida).toHaveBeenCalledWith({
      questionId: 'q1',
      answerText: 'Resposta',
      answeredBy: 'manual',
    })
  })

  it('bloqueia reenvio de pergunta já respondida', async () => {
    vi.mocked(acharPergunta).mockResolvedValue(pergunta({ status: 'answered' }) as never)
    await expect(responderPergunta('q1', 't1', 'x', 'manual')).rejects.toBeInstanceOf(
      PerguntaJaRespondidaError
    )
    expect(responderPerguntaML).not.toHaveBeenCalled()
  })

  it('erra quando o ML não está conectado', async () => {
    vi.mocked(acharPergunta).mockResolvedValue(pergunta() as never)
    vi.mocked(getMlCredentials).mockResolvedValue(null)
    await expect(responderPergunta('q1', 't1', 'x', 'manual')).rejects.toBeInstanceOf(
      MlNaoConectadoError
    )
  })

  it('aprovarSugestao falha se a pergunta não existe', async () => {
    vi.mocked(acharPergunta).mockResolvedValue(null)
    await expect(aprovarSugestao('qX', 't1')).rejects.toBeInstanceOf(PerguntaNaoEncontradaError)
  })
})
