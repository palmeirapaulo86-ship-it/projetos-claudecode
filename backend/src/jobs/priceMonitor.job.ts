import { scrapingQueue, notificationQueue } from '../lib/bull'
import { redis } from '../lib/redis'
import { logger } from '../lib/logger'
import { abrirBrowser, scrapeMercadoLivre, CaptchaDetectadoError } from '../integrations/mercadolivre/priceScraper'
import {
  registrarColeta,
  listarConcorrentesAtivos,
  precoDoAnuncio,
} from '../repositories/competitor.repository'
import { alertasAtivosDoTipo, marcarAlertaDisparado } from '../repositories/alert.repository'

const TICK_JOB = 'monitor-tick'
const SCRAPE_JOB = 'scrape-competitor'
const INTERVALO_MS = 30 * 60 * 1000 // coleta a cada 30 minutos (dado crítico)

interface ScrapeJobData {
  competitorId: string
  tenantId: string
  listingId: string
  externalId: string
  platform: string
}

// Reconstrói a URL do anúncio no Mercado Livre a partir do externalId (MLB123...).
function urlDoExternalId(externalId: string): string {
  const digits = externalId.replace(/\D/g, '')
  return `https://produto.mercadolivre.com.br/MLB-${digits}`
}

// Avalia os alertas do tenant após uma coleta e enfileira notificação se disparar.
async function avaliarAlertas(data: ScrapeJobData, precoConcorrente: number, concorrenteTemBuyBox: boolean) {
  const anuncio = await precoDoAnuncio(data.listingId, data.tenantId)
  if (!anuncio) return
  const precoProprio = Number(anuncio.price)

  // Alerta de queda de preço: concorrente abaixo do preço próprio além do threshold
  const alertasPreco = await alertasAtivosDoTipo(data.tenantId, 'price_drop')
  for (const alerta of alertasPreco) {
    const threshold = Number((alerta.config as { thresholdReais?: number })?.thresholdReais ?? 0)
    if (precoConcorrente < precoProprio - threshold) {
      await notificationQueue.add('alert', {
        tenantId: data.tenantId,
        type: 'price_drop',
        message: `Concorrente a R$${precoConcorrente.toFixed(2)} — abaixo do seu "${anuncio.title}" (R$${precoProprio.toFixed(2)})`,
      })
      await marcarAlertaDisparado(alerta.id)
    }
  }

  // Alerta de perda de buy box: algum concorrente passou a deter a oferta principal
  if (concorrenteTemBuyBox) {
    const alertasBuyBox = await alertasAtivosDoTipo(data.tenantId, 'buy_box_lost')
    for (const alerta of alertasBuyBox) {
      await notificationQueue.add('alert', {
        tenantId: data.tenantId,
        type: 'buy_box_lost',
        message: `Você pode ter perdido o buy box em "${anuncio.title}" — concorrente está com a oferta principal`,
      })
      await marcarAlertaDisparado(alerta.id)
    }
  }
}

// Registra: o scheduler recorrente, o worker do tick e o worker de scrape.
export async function registrarMonitorDePreco() {
  // 1) Tick recorrente: a cada 30 min, enfileira uma coleta por concorrente ativo
  await scrapingQueue.add(
    TICK_JOB,
    {},
    { repeat: { every: INTERVALO_MS }, jobId: 'price-monitor-scheduler' } // jobId fixo evita duplicar o agendamento
  )

  scrapingQueue.process(TICK_JOB, async () => {
    const concorrentes = await listarConcorrentesAtivos()
    logger.info(`Monitor de preço: enfileirando ${concorrentes.length} coletas`)
    for (const c of concorrentes) {
      await scrapingQueue.add(SCRAPE_JOB, c as ScrapeJobData, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }, // 1s, 5s, 30s aprox.
        timeout: 45_000,
        removeOnComplete: true,
        removeOnFail: 100,
      })
    }
  })

  // 2) Worker de coleta: scrape → Redis (bruto, TTL 24h) → consolida no Postgres → alertas
  scrapingQueue.process(SCRAPE_JOB, 1, async (job) => {
    const data = job.data as ScrapeJobData
    const browser = await abrirBrowser()
    try {
      const scraped = await scrapeMercadoLivre(urlDoExternalId(data.externalId), browser)

      // Resultado bruto vai para o Redis antes de processar (regra do scraper)
      await redis.setex(`scraping:result:${data.competitorId}`, 24 * 60 * 60, JSON.stringify(scraped))

      await registrarColeta({
        tenantId: data.tenantId,
        listingId: data.listingId,
        platform: data.platform,
        scraped,
      })

      await avaliarAlertas(data, scraped.price, scraped.hasBuyBox)
      logger.info('Coleta concluída', { competitorId: data.competitorId, price: scraped.price })
    } catch (err) {
      // CAPTCHA: não adianta retentar imediatamente — loga e deixa o backoff espaçar
      if (err instanceof CaptchaDetectadoError) {
        logger.warn('Coleta pausada por CAPTCHA', { competitorId: data.competitorId })
      }
      throw err
    } finally {
      await browser.close()
    }
  })

  logger.info('Monitor de preço registrado (coleta a cada 30 min)')
}

// Enfileira uma coleta avulsa imediata (usado ao adicionar um novo concorrente).
export async function enfileirarColetaImediata(data: ScrapeJobData): Promise<string> {
  const job = await scrapingQueue.add(SCRAPE_JOB, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    timeout: 45_000,
    removeOnComplete: true,
  })
  return job.id.toString()
}
