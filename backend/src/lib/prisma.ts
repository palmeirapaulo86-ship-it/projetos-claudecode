import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
          ]
        : [{ emit: 'event', level: 'error' }],
  })

if (process.env.NODE_ENV === 'development') {
  // Logar queries que demoram mais de 500ms
  prisma.$on('query' as never, (e: { duration: number; query: string }) => {
    if (e.duration > 500) {
      logger.warn(`Query lenta (${e.duration}ms): ${e.query}`)
    }
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
