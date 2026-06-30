import { Router } from 'express'
import { autenticarUsuario } from '../middleware/auth'
import {
  listarPerguntasController,
  aprovarController,
  editarEEnviarController,
} from '../controllers/question.controller'

export const questionRouter = Router()

// GET /api/questions?status=...
questionRouter.get('/', autenticarUsuario, listarPerguntasController)
// POST /api/questions/:id/approve — aprova e envia a resposta sugerida pela IA
questionRouter.post('/:id/approve', autenticarUsuario, aprovarController)
// PATCH /api/questions/:id — edita e envia a resposta
questionRouter.patch('/:id', autenticarUsuario, editarEEnviarController)
