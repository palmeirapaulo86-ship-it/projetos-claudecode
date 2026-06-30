import { Request, Response, NextFunction } from 'express'
import { successResponse, errorResponse } from '../types'
import { sendAnswerInputSchema, createAutoReplyInputSchema } from '../validations/question.validation'
import {
  listarPerguntasDoTenant,
  responderPergunta,
  aprovarSugestao,
  configurarAutoReply,
  listarAutoRepliesDoTenant,
  PerguntaNaoEncontradaError,
  MlNaoConectadoError,
  PerguntaJaRespondidaError,
} from '../services/question.service'
import { ListingNaoEncontradoError } from '../services/listing.service'

function tratarErro(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof PerguntaNaoEncontradaError)
    return res.status(404).json(errorResponse('PERGUNTA_NAO_ENCONTRADA', err.message))
  if (err instanceof ListingNaoEncontradoError)
    return res.status(404).json(errorResponse('LISTING_NAO_ENCONTRADO', err.message))
  if (err instanceof MlNaoConectadoError)
    return res.status(409).json(errorResponse('ML_NAO_CONECTADO', err.message))
  if (err instanceof PerguntaJaRespondidaError)
    return res.status(409).json(errorResponse('PERGUNTA_JA_RESPONDIDA', err.message))
  return next(err)
}

// GET /api/questions?status=pending|suggested|answered
export async function listarPerguntasController(req: Request, res: Response, next: NextFunction) {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const perguntas = await listarPerguntasDoTenant(req.tenantId!, status)
    return res.json(successResponse(perguntas))
  } catch (err) {
    return next(err)
  }
}

// POST /api/questions/:id/approve — envia a resposta sugerida pela IA
export async function aprovarController(req: Request, res: Response, next: NextFunction) {
  try {
    const pergunta = await aprovarSugestao(req.params.id, req.tenantId!)
    return res.json(successResponse(pergunta))
  } catch (err) {
    return tratarErro(err, res, next)
  }
}

// PATCH /api/questions/:id — envia uma resposta editada manualmente
export async function editarEEnviarController(req: Request, res: Response, next: NextFunction) {
  try {
    const { text } = sendAnswerInputSchema.parse(req.body)
    const pergunta = await responderPergunta(req.params.id, req.tenantId!, text, 'manual')
    return res.json(successResponse(pergunta))
  } catch (err) {
    return tratarErro(err, res, next)
  }
}

// POST /api/listings/:id/auto-replies
export async function criarAutoReplyController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createAutoReplyInputSchema.parse(req.body)
    const regra = await configurarAutoReply(req.params.id, req.tenantId!, input)
    return res.status(201).json(successResponse(regra))
  } catch (err) {
    return tratarErro(err, res, next)
  }
}

// GET /api/listings/:id/auto-replies
export async function listarAutoRepliesController(req: Request, res: Response, next: NextFunction) {
  try {
    const regras = await listarAutoRepliesDoTenant(req.tenantId!)
    return res.json(successResponse(regras))
  } catch (err) {
    return next(err)
  }
}
