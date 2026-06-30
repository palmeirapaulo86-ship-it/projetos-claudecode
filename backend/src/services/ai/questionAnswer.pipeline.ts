import { anthropic, CLAUDE_MODEL } from '../../lib/anthropic'
import { logger } from '../../lib/logger'
import {
  questionAnswerOutputSchema,
  type QuestionAnswerOutput,
} from '../../validations/question.validation'

// Sem cache: cada pergunta é única (regra do agente ai-engine).

const SYSTEM_PROMPT = `Você é o atendente de uma loja no Mercado Livre Brasil. Responde perguntas de compradores
de forma curta, cordial e objetiva, usando APENAS as informações do produto fornecidas.

Regras:
- Máximo de 500 caracteres na resposta
- Nunca invente dados (preço, prazo, voltagem, garantia) que não estejam no contexto do produto
- Se a pergunta pede algo que NÃO dá para responder com segurança pelo contexto, marque requer_revisao_humana = true e explique o motivo
- Tom profissional e gentil, em português do Brasil

Classifique a pergunta em uma destas categorias: frete, estoque, caracteristicas, pagamento, garantia, outro.

Responda SEMPRE e SOMENTE com JSON válido, sem markdown, neste formato exato:
{
  "categoria": "<uma das categorias>",
  "resposta": "<resposta ao comprador, máx 500 caracteres>",
  "confianca": <número de 0 a 1>,
  "requer_revisao_humana": <true|false>,
  "motivo_revisao": <string explicando, ou null>
}`

function montarPrompt(params: { questionText: string; title: string; description: string }): string {
  const desc = params.description.slice(0, 2000) // limita o contexto para controlar tokens
  return [
    `Produto: ${params.title}`,
    `Descrição do produto:\n${desc || '(sem descrição)'}`,
    '',
    `Pergunta do comprador: "${params.questionText}"`,
    '',
    'Gere a resposta no formato JSON especificado.',
  ].join('\n')
}

function extrairJSON(texto: string): unknown {
  const limpo = texto.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(limpo)
}

async function chamarIA(params: {
  questionText: string
  title: string
  description: string
}): Promise<QuestionAnswerOutput> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 700,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: montarPrompt(params) }],
  })

  const bloco = response.content.find((b) => b.type === 'text')
  if (!bloco || bloco.type !== 'text') throw new Error('Resposta da IA sem bloco de texto')

  logger.info('Resposta de pergunta: tokens usados', {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  })

  return questionAnswerOutputSchema.parse(extrairJSON(bloco.text))
}

// Pipeline: prompt com contexto → API → validação Zod, com retry único em formato inválido.
export async function sugerirRespostaPergunta(params: {
  questionText: string
  title: string
  description: string
}): Promise<QuestionAnswerOutput> {
  try {
    return await chamarIA(params)
  } catch (err) {
    logger.warn('Sugestão de resposta falhou na 1ª tentativa, retentando', {
      error: err instanceof Error ? err.message : String(err),
    })
    return chamarIA(params)
  }
}
