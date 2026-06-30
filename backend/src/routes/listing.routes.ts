import { Router } from 'express'
import { autenticarUsuario } from '../middleware/auth'
import { aiRateLimiter } from '../middleware/rateLimiter'
import {
  analisarTituloController,
  statusAnaliseController,
} from '../controllers/listing.controller'

export const listingRouter = Router()

// Toda rota: autenticação → rate limit (IA é cara) → handler
listingRouter.post(
  '/:id/analyze/title',
  autenticarUsuario,
  aiRateLimiter,
  analisarTituloController
)

listingRouter.get(
  '/:id/analyze/title/:jobId',
  autenticarUsuario,
  statusAnaliseController
)
