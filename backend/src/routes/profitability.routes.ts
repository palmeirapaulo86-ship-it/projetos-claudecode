import { Router } from 'express'
import { autenticarUsuario } from '../middleware/auth'
import { listarRentabilidadesController } from '../controllers/profitability.controller'

export const profitabilityRouter = Router()

// GET /api/profitability — todos os produtos com custos, ordenados por margem
profitabilityRouter.get('/', autenticarUsuario, listarRentabilidadesController)
