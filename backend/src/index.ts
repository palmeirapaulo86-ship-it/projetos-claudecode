import 'dotenv/config'
import { validateEnv } from './lib/env'
import { app } from './app'
import { logger } from './lib/logger'
import { prisma } from './lib/prisma'
import { redis } from './lib/redis'
import { registrarWorkerAnaliseDeTitulo } from './jobs/titleAnalysis.job'
import { registrarMonitorDePreco } from './jobs/priceMonitor.job'

// Validar todas as variáveis de ambiente antes de iniciar
validateEnv()

const PORT = process.env.PORT || 3001

async function main() {
  // Verificar conexão com banco antes de subir
  await prisma.$connect()
  logger.info('Banco de dados conectado')

  // Registra os workers Bull (processamento assíncrono de IA e scraping)
  registrarWorkerAnaliseDeTitulo()
  await registrarMonitorDePreco()

  const server = app.listen(PORT, () => {
    logger.info(`Servidor rodando na porta ${PORT} [${process.env.NODE_ENV}]`)
  })

  // Graceful shutdown — fechar conexões ao encerrar
  const shutdown = async () => {
    logger.info('Encerrando servidor...')
    server.close(async () => {
      await prisma.$disconnect()
      redis.disconnect()
      logger.info('Servidor encerrado')
      process.exit(0)
    })
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

main().catch((err) => {
  logger.error('Erro fatal ao iniciar servidor:', err)
  process.exit(1)
})
