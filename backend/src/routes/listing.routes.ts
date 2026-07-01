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
import {
  cadastrarCustosController,
  rentabilidadeController,
  analisarRentController,
  statusAnaliseRentController,
} from '../controllers/profitability.controller'
import {
  registrarVendasController,
  tendenciaController,
  diagnosticarController,
  statusDiagnosticoController,
} from '../controllers/salesDrop.controller'

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

// Feature 4 — Rentabilidade
listingRouter.post('/:id/costs', autenticarUsuario, cadastrarCustosController)
listingRouter.get('/:id/profitability', autenticarUsuario, rentabilidadeController)
listingRouter.post('/:id/profitability/analyze', autenticarUsuario, aiRateLimiter, analisarRentController)
listingRouter.get('/:id/profitability/analyze/:jobId', autenticarUsuario, statusAnaliseRentController)

// Feature 5 — Detector de queda de vendas
listingRouter.post('/:id/sales', autenticarUsuario, registrarVendasController)
listingRouter.get('/:id/sales', autenticarUsuario, tendenciaController)
listingRouter.post('/:id/diagnosis', autenticarUsuario, aiRateLimiter, diagnosticarController)
listingRouter.get('/:id/diagnosis/:jobId', autenticarUsuario, statusDiagnosticoController)
