import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { globalRateLimiter } from './middleware/rateLimiter'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import { successResponse } from './types'

export const app = express()

app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(requestLogger)
app.use('/api', globalRateLimiter)

app.get('/health', (_req, res) => {
  res.json(successResponse({ status: 'ok', env: process.env.NODE_ENV }))
})

// Rotas serão registradas aqui conforme cada feature for construída
// Exemplo: app.use('/api/listings', listingsRouter)

// Middleware de erro — deve ser o último
app.use(errorHandler)
