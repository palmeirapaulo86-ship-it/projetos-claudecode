import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { globalRateLimiter } from './middleware/rateLimiter'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import { successResponse } from './types'
import { listingRouter } from './routes/listing.routes'

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

// Rotas das features
app.use('/api/listings', listingRouter)

// Middleware de erro — deve ser o último
app.use(errorHandler)
