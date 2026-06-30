import { scrapingQueue } from '../lib/bull'
import { logger } from '../lib/logger'
import { getMlCredentials } from '../integrations/mercadolivre/mlCredentials'
import { buscarPerguntasNaoRespondidas } from '../integrations/mercadolivre/mlApiClient'
import {
  tenantsComAnunciosML,
  acharListingPorExternalId,
  inserirPerguntaNova,
} from '../repositories/question.repository'
import { enfileirarSugestaoResposta } from './questionAi.job'

const TICK_JOB = 'questions-poll'
const INTERVALO_MS = 5 * 60 * 1000 // perguntas novas a cada 5 minutos (agente scraper)

// Coleta perguntas novas de um tenant e enfileira a sugestão de IA para cada uma.
async function coletarPerguntasDoTenant(tenantId: string) {
  const cred = await getMlCredentials(tenantId)
  if (!cred) return // tenant sem ML conectado — pula silenciosamente

  const perguntas = await buscarPerguntasNaoRespondidas(cred.accessToken, cred.sellerId)
  let novas = 0

  for (const p of perguntas) {
    // Vincula a pergunta ao anúncio interno correspondente
    const listing = await acharListingPorExternalId(tenantId, p.itemId)
    if (!listing) continue // anúncio ainda não importado para o sistema

    const criada = await inserirPerguntaNova({
      tenantId,
      listingId: listing.id,
      externalId: p.externalId,
      questionText: p.text,
      buyerName: p.buyerId,
    })
    if (!criada) continue // já existia (idempotência)

    novas++
    await enfileirarSugestaoResposta({
      questionId: criada.id,
      tenantId,
      externalId: p.externalId,
      questionText: p.text,
      title: listing.title,
      description: listing.description ?? '',
    })
  }

  if (novas > 0) logger.info(`Coletor de perguntas: ${novas} novas para tenant ${tenantId}`)
}

export async function registrarColetorDePerguntas() {
  // Tick recorrente a cada 5 min
  await scrapingQueue.add(
    TICK_JOB,
    {},
    { repeat: { every: INTERVALO_MS }, jobId: 'questions-poll-scheduler' }
  )

  scrapingQueue.process(TICK_JOB, async () => {
    const tenants = await tenantsComAnunciosML()
    logger.info(`Coletor de perguntas: verificando ${tenants.length} tenants`)
    for (const { tenantId } of tenants) {
      try {
        await coletarPerguntasDoTenant(tenantId)
      } catch (err) {
        // Um tenant com erro (token expirado, rate limit) não pode derrubar os outros
        logger.warn('Falha ao coletar perguntas de um tenant', {
          tenantId,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  })

  logger.info('Coletor de perguntas registrado (polling a cada 5 min)')
}
