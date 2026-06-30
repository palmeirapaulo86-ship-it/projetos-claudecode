import Redis from 'ioredis'
import { logger } from './logger'

export const redis = new Redis(process.env.REDIS_URL!, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
})

redis.on('connect', () => logger.info('Redis conectado'))
redis.on('ready', () => logger.info('Redis pronto'))
redis.on('error', (err) => logger.error('Erro no Redis:', err))
redis.on('close', () => logger.warn('Conexão com Redis encerrada'))
