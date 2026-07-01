import { createHash } from 'crypto'
import { anthropic, CLAUDE_MODEL } from '../../lib/anthropic'
import { redis } from '../../lib/redis'
import { logger } from '../../lib/logger'
import {
  salesDiagnosisOutputSchema,
  type SalesDiagnosisOutput,
} from '../../validations/salesDrop.validation'
import type { SalesTrend } from '../salesTrend.calc'

// Diagnóstico de vendas: cache de 6h (regra do agente ai-engine)
const CACHE_TTL_SEGUNDOS = 6 * 60 * 60

const SYSTEM_PROMPT = `Você é um analista de vendas de marketplace no Brasil. Recebe estatísticas JÁ CALCULADAS de
vendas de um produto (comparando os últimos 30 dias com os 30 anteriores) e o contexto do produto, e
diagnostica a causa provável da queda, com evidências e ações práticas.

Regras:
- NÃO recalcule os números — eles são a verdade
- Considere causas comuns: aumento de preço próprio, concorrente mais barato, perda de buy box, sazonalidade,
  ruptura de estoque, piora de reputação, mudança no anúncio
- Seja específico e acionável nas ações recomendadas
- Português do Brasil, direto
- Urgência 'alta' se a queda for acentuada (>50%) ou o produto for relevante; 'media' para quedas moderadas; 'baixa' se leve

Responda SEMPRE e SOMENTE com JSON válido, sem markdown, neste formato:
{
  "causa_provavel": "<causa mais provável, 1-3 frases>",
  "evidencias": [<lista curta de evidências dos números/contexto>],
  "acoes_recomendadas": [<lista de ações concretas>],
  "urgencia": "baixa" | "media" | "alta"
}`

interface DiagnosisContext {
  title: string
  trend: SalesTrend
  precoAtual?: number | null
  temConcorrenteMaisBarato?: boolean
  perdeuBuyBox?: boolean
}

function montarPrompt(ctx: DiagnosisContext): string {
  const t = ctx.trend
  const linhas = [
    `Produto: ${ctx.title}`,
    `Vendas últimos 30 dias: ${t.unitsRecent30} unidades (média ${t.avgDailyRecent}/dia)`,
    `Vendas 30 dias anteriores: ${t.unitsPrevious30} unidades (média ${t.avgDailyPrevious}/dia)`,
    `Queda detectada: ${t.declinePercent}%`,
    `Total em 90 dias: ${t.totalUnits90} unidades`,
  ]
  if (ctx.precoAtual != null) linhas.push(`Preço atual: R$${ctx.precoAtual.toFixed(2)}`)
  if (ctx.temConcorrenteMaisBarato) linhas.push('Há concorrente monitorado MAIS BARATO que o produto.')
  if (ctx.perdeuBuyBox) linhas.push('Um concorrente está com o buy box.')
  linhas.push('', 'Gere o diagnóstico no formato JSON especificado.')
  return linhas.join('\n')
}

function extrairJSON(texto: string): unknown {
  const limpo = texto.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(limpo)
}

async function chamarIA(ctx: DiagnosisContext): Promise<SalesDiagnosisOutput> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 900,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: montarPrompt(ctx) }],
  })
  const bloco = response.content.find((b) => b.type === 'text')
  if (!bloco || bloco.type !== 'text') throw new Error('Resposta da IA sem bloco de texto')

  logger.info('Diagnóstico de vendas: tokens usados', {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  })
  return salesDiagnosisOutputSchema.parse(extrairJSON(bloco.text))
}

// Gera o diagnóstico a partir das estatísticas calculadas. Cache 6h + retry único.
export async function diagnosticarQueda(ctx: DiagnosisContext): Promise<SalesDiagnosisOutput> {
  const hashKey = createHash('sha256')
    .update(
      JSON.stringify({
        title: ctx.title,
        recent: ctx.trend.unitsRecent30,
        prev: ctx.trend.unitsPrevious30,
        conc: ctx.temConcorrenteMaisBarato,
        buybox: ctx.perdeuBuyBox,
      })
    )
    .digest('hex')
  const cacheKey = `ai:sales_diagnosis:${hashKey}`

  const cached = await redis.get(cacheKey)
  if (cached) {
    logger.info('Diagnóstico de vendas: cache hit')
    return JSON.parse(cached)
  }

  let output: SalesDiagnosisOutput
  try {
    output = await chamarIA(ctx)
  } catch (err) {
    logger.warn('Diagnóstico de vendas falhou na 1ª tentativa, retentando', {
      error: err instanceof Error ? err.message : String(err),
    })
    output = await chamarIA(ctx)
  }

  await redis.setex(cacheKey, CACHE_TTL_SEGUNDOS, JSON.stringify(output))
  return output
}
