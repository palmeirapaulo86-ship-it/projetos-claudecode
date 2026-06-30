import { Router } from 'express'
import { autenticarUsuario } from '../middleware/auth'
import { historicoPrecoController } from '../controllers/competitor.controller'

export const competitorRouter = Router()

// GET /api/competitors/:competitorId/price-history?hours=24
competitorRouter.get(
  '/:competitorId/price-history',
  autenticarUsuario,
  historicoPrecoController
)
