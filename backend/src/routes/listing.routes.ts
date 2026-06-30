import { Router } from 'express'
import { autenticarUsuario } from '../middleware/auth'
import { aiRateLimiter } from '../middleware/rateLimiter'
import {
  analisarTituloController,
  statusAnaliseController,
} from '../controllers/listing.controller'
import {
  adicionarConcorrenteController,
  listarConcorrentesController,
  criarAlertaController,
  listarAlertasController,
} from '../controllers/competitor.controller'
import {
  criarAutoReplyController,
  listarAutoRepliesController,
} from '../controllers/question.controller'

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

// Feature 2 — Monitor de Preço de Concorrentes
listingRouter.post('/:id/competitors', autenticarUsuario, adicionarConcorrenteController)
listingRouter.get('/:id/competitors', autenticarUsuario, listarConcorrentesController)
listingRouter.post('/:id/alerts', autenticarUsuario, criarAlertaController)
listingRouter.get('/:id/alerts', autenticarUsuario, listarAlertasController)

// Feature 3 — Regras de auto-resposta
listingRouter.post('/:id/auto-replies', autenticarUsuario, criarAutoReplyController)
listingRouter.get('/:id/auto-replies', autenticarUsuario, listarAutoRepliesController)
