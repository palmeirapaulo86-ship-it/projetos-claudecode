import { createHash } from 'crypto'
import { anthropic, CLAUDE_MODEL } from '../../lib/anthropic'
import { redis } from '../../lib/redis'
import { logger } from '../../lib/logger'
import {
  titleAnalysisOutputSchema,
  type AnalyzeTitleInput,
  type TitleAnalysisOutput,
} from '../../validations/titleAnalysis.validation'

// Cache de 24h: título muda pouco, não gastar token à toa (ver agents/ai-engine.md)
const CACHE_TTL_SEGUNDOS = 24 * 60 * 60

const SYSTEM_PROMPT = `Você é especialista em SEO de marketplace com foco em Mercado Livre Brasil.
Avalia títulos de anúncios e devolve um diagnóstico acionável para o vendedor aumentar conversão e ranqueamento.

Critérios de avaliação:
- Uso de palavras-chave relevantes que o comprador realmente busca
- Presença de marca, modelo e atributos importantes (cor, tamanho, voltagem, etc.)
- Aproveitamento do limite de 60 caracteres do Mercado Livre
- Ausência de termos proibidos, repetição desnecessária e CAPS LOCK excessivo

Responda SEMPRE e SOMENTE com um objeto JSON válido, sem markdown, sem texto antes ou depois, neste formato exato:
{
  "score": <número inteiro de 0 a 100>,
  "problemas": [<lista de problemas encontrados, em português>],
  "sugestoes": [<lista de melhorias práticas, em português>],
  "titulos_alternativos": [<exatamente 3 títulos otimizados alternativos>]
}`

function gerarHashDoInput(input: AnalyzeTitleInput): string {
  const base = JSON.stringify({
    title: input.title,
    category: input.category ?? '',
    keywords: (input.keywords ?? []).slice().sort(),
  })
  return createHash('sha256').update(base).digest('hex')
}

function montarPrompt(input: AnalyzeTitleInput): string {
  const partes = [`Título atual do anúncio: "${input.title}"`]
  if (input.category) partes.push(`Categoria: ${input.category}`)
  if (input.keywords?.length) partes.push(`Palavras-chave principais: ${input.keywords.join(', ')}`)
  partes.push('\nAnalise esse título e retorne o JSON no formato especificado.')
  return partes.join('\n')
}

// Extrai o JSON da resposta da IA, tolerando cercas de código eventuais.
function extrairJSON(texto: string): unknown {
  const limpo = texto.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(limpo)
}

async function chamarIA(input: AnalyzeTitleInput): Promise<TitleAnalysisOutput> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: montarPrompt(input) }],
  })

  // O primeiro bloco pode não ser texto — sempre checar o tipo antes de ler .text
  const bloco = response.content.find((b) => b.type === 'text')
  if (!bloco || bloco.type !== 'text') {
    throw new Error('Resposta da IA sem bloco de texto')
  }

  logger.info('Análise de título: tokens usados', {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  })

  const json = extrairJSON(bloco.text)
  return titleAnalysisOutputSchema.parse(json)
}

export interface TitleAnalysisResult {
  output: TitleAnalysisOutput
  rawResponse: string
  cacheHit: boolean
}

// Pipeline completo: cache → prompt → API → validação Zod → cache.
// Retenta 1 vez em caso de formato inválido (ver agents/ai-engine.md, regra 6).
export async function analisarTitulo(input: AnalyzeTitleInput): Promise<TitleAnalysisResult> {
  const cacheKey = `ai:title_analysis:${gerarHashDoInput(input)}`

  const cached = await redis.get(cacheKey)
  if (cached) {
    logger.info('Análise de título: cache hit')
    return { output: JSON.parse(cached), rawResponse: cached, cacheHit: true }
  }

  let output: TitleAnalysisOutput
  try {
    output = await chamarIA(input)
  } catch (err) {
    logger.warn('Análise de título falhou na 1ª tentativa, retentando', {
      error: err instanceof Error ? err.message : String(err),
    })
    output = await chamarIA(input) // retry único; se falhar de novo, propaga o erro tratado
  }

  const serialized = JSON.stringify(output)
  await redis.setex(cacheKey, CACHE_TTL_SEGUNDOS, serialized)

  return { output, rawResponse: serialized, cacheHit: false }
}
