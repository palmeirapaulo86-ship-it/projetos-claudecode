import { createHash } from 'crypto'
import { anthropic, CLAUDE_MODEL } from '../../lib/anthropic'
import { redis } from '../../lib/redis'
import { logger } from '../../lib/logger'
import {
  profitabilityAiOutputSchema,
  type ProfitabilityAiOutput,
} from '../../validations/profitability.validation'
import type { ProfitabilityResult } from '../profitability.calc'

// Custo muda pouco → cache de 24h (regra do agente ai-engine)
const CACHE_TTL_SEGUNDOS = 24 * 60 * 60

const SYSTEM_PROMPT = `Você é um consultor financeiro de e-commerce para vendedores de marketplace no Brasil.
Recebe os números de rentabilidade JÁ CALCULADOS de um produto e escreve uma análise objetiva e uma recomendação prática.

Regras:
- NÃO recalcule nem contradiga os números fornecidos — eles são a verdade
- Seja específico e acionável (ex.: "suba o preço para X", "renegocie o frete", "pause o anúncio")
- Português do Brasil, tom direto e profissional
- Se o produto está no prejuízo, deixe a urgência 'alta'

Responda SEMPRE e SOMENTE com JSON válido, sem markdown, neste formato:
{
  "analise": "<2-4 frases interpretando a rentabilidade>",
  "recomendacao": "<ação concreta recomendada>",
  "urgencia": "baixa" | "media" | "alta"
}`

function montarPrompt(titulo: string, r: ProfitabilityResult): string {
  return [
    `Produto: ${titulo}`,
    `Preço de venda: R$${r.price.toFixed(2)}`,
    `Taxa da plataforma: R$${r.platformFeeValue.toFixed(2)}`,
    `Perda por devoluções: R$${r.returnLossValue.toFixed(2)}`,
    `Custo total: R$${r.totalCost.toFixed(2)}`,
    `Lucro líquido: R$${r.netProfit.toFixed(2)}`,
    `Margem: ${r.marginPercent.toFixed(2)}%`,
    `Ponto de equilíbrio (preço mínimo): R$${r.breakEvenPrice.toFixed(2)}`,
    r.isLoss ? 'SITUAÇÃO: produto está no PREJUÍZO.' : 'SITUAÇÃO: produto está no lucro.',
    '',
    'Escreva a análise e a recomendação no formato JSON especificado.',
  ].join('\n')
}

function extrairJSON(texto: string): unknown {
  const limpo = texto.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(limpo)
}

async function chamarIA(titulo: string, r: ProfitabilityResult): Promise<ProfitabilityAiOutput> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 700,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: montarPrompt(titulo, r) }],
  })
  const bloco = response.content.find((b) => b.type === 'text')
  if (!bloco || bloco.type !== 'text') throw new Error('Resposta da IA sem bloco de texto')

  logger.info('Rentabilidade: tokens usados', {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  })
  return profitabilityAiOutputSchema.parse(extrairJSON(bloco.text))
}

// Gera análise + recomendação a partir dos números calculados. Cache 24h + retry único.
export async function analisarRentabilidade(
  titulo: string,
  r: ProfitabilityResult
): Promise<ProfitabilityAiOutput> {
  const hashKey = createHash('sha256')
    .update(JSON.stringify({ titulo, netProfit: r.netProfit, margin: r.marginPercent }))
    .digest('hex')
  const cacheKey = `ai:profitability:${hashKey}`

  const cached = await redis.get(cacheKey)
  if (cached) {
    logger.info('Rentabilidade: cache hit')
    return JSON.parse(cached)
  }

  let output: ProfitabilityAiOutput
  try {
    output = await chamarIA(titulo, r)
  } catch (err) {
    logger.warn('Análise de rentabilidade falhou na 1ª tentativa, retentando', {
      error: err instanceof Error ? err.message : String(err),
    })
    output = await chamarIA(titulo, r)
  }

  await redis.setex(cacheKey, CACHE_TTL_SEGUNDOS, JSON.stringify(output))
  return output
}
