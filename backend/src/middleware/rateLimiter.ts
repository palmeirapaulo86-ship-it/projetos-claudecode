import rateLimit from 'express-rate-limit'
import { errorResponse } from '../types'

// Rate limiter global: 500 requisições por 15 minutos por IP
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: errorResponse('RATE_LIMIT', 'Muitas requisições, tente novamente em alguns minutos'),
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiter para endpoints de IA — caro por chamada, limitar mais
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: errorResponse('AI_RATE_LIMIT', 'Limite de análises por minuto atingido'),
  standardHeaders: true,
  legacyHeaders: false,
})
