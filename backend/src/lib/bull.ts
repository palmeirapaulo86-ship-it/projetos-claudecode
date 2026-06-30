import Bull from 'bull'
import { logger } from './logger'

const redisConfig = { redis: process.env.REDIS_URL! }

export const scrapingQueue = new Bull('scraping', redisConfig)
export const aiAnalysisQueue = new Bull('ai-analysis', redisConfig)
export const notificationQueue = new Bull('notifications', redisConfig)

// Eventos padrão de log para todas as filas
const queues = [scrapingQueue, aiAnalysisQueue, notificationQueue]
queues.forEach((queue) => {
  queue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} falhou na fila "${queue.name}":`, { error: err.message, data: job.data })
  })
  queue.on('completed', (job) => {
    logger.info(`Job ${job.id} concluído na fila "${queue.name}"`)
  })
  queue.on('stalled', (job) => {
    logger.warn(`Job ${job.id} travado na fila "${queue.name}"`)
  })
})
