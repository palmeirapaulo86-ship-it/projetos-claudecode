import { Router } from 'express'
import { autenticarUsuario } from '../middleware/auth'
import { listarQuedasController } from '../controllers/salesDrop.controller'

export const salesRouter = Router()

// GET /api/sales/trends — todos os produtos, quedas primeiro
salesRouter.get('/trends', autenticarUsuario, listarQuedasController)
