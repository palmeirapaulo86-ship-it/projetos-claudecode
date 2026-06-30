import { Request, Response, NextFunction } from 'express'
import { successResponse, errorResponse } from '../types'
import {
  addCompetitorInputSchema,
  createAlertInputSchema,
} from '../validations/competitor.validation'
import {
  adicionarConcorrente,
  listarConcorrentesComComparacao,
  obterHistorico,
  configurarAlerta,
  listarAlertasDoTenant,
} from '../services/competitor.service'
import { ListingNaoEncontradoError } from '../services/listing.service'

function tratarErro(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof ListingNaoEncontradoError) {
    return res.status(404).json(errorResponse('LISTING_NAO_ENCONTRADO', err.message))
  }
  return next(err)
}

// POST /api/listings/:id/competitors
export async function adicionarConcorrenteController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = addCompetitorInputSchema.parse(req.body)
    const result = await adicionarConcorrente(req.params.id, req.tenantId!, input)
    return res.status(202).json(successResponse(result))
  } catch (err) {
    return tratarErro(err, res, next)
  }
}

// GET /api/listings/:id/competitors
export async function listarConcorrentesController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listarConcorrentesComComparacao(req.params.id, req.tenantId!)
    return res.json(successResponse(data))
  } catch (err) {
    return tratarErro(err, res, next)
  }
}

// GET /api/competitors/:competitorId/price-history?hours=24
export async function historicoPrecoController(req: Request, res: Response, next: NextFunction) {
  try {
    const horas = Math.min(Math.max(Number(req.query.hours) || 24, 1), 720)
    const data = await obterHistorico(req.params.competitorId, req.tenantId!, horas)
    return res.json(successResponse(data))
  } catch (err) {
    return next(err)
  }
}

// POST /api/listings/:id/alerts
export async function criarAlertaController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createAlertInputSchema.parse(req.body)
    const alerta = await configurarAlerta(req.params.id, req.tenantId!, input)
    return res.status(201).json(successResponse(alerta))
  } catch (err) {
    return tratarErro(err, res, next)
  }
}

// GET /api/listings/:id/alerts  (lista os alertas do tenant)
export async function listarAlertasController(req: Request, res: Response, next: NextFunction) {
  try {
    const alertas = await listarAlertasDoTenant(req.tenantId!)
    return res.json(successResponse(alertas))
  } catch (err) {
    return next(err)
  }
}
