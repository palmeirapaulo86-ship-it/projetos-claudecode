import { Request, Response, NextFunction } from 'express'
import { successResponse, errorResponse } from '../types'
import { upsertCostInputSchema } from '../validations/profitability.validation'
import {
  cadastrarCustos,
  obterRentabilidade,
  listarRentabilidades,
  solicitarAnaliseIA,
  consultarAnaliseIA,
  CustosNaoCadastradosError,
} from '../services/profitability.service'
import { ListingNaoEncontradoError } from '../services/listing.service'

function tratarErro(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof ListingNaoEncontradoError)
    return res.status(404).json(errorResponse('LISTING_NAO_ENCONTRADO', err.message))
  if (err instanceof CustosNaoCadastradosError)
    return res.status(404).json(errorResponse('CUSTOS_NAO_CADASTRADOS', err.message))
  return next(err)
}

// POST /api/listings/:id/costs
export async function cadastrarCustosController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = upsertCostInputSchema.parse(req.body)
    const result = await cadastrarCustos(req.params.id, req.tenantId!, input)
    return res.status(201).json(successResponse(result))
  } catch (err) {
    return tratarErro(err, res, next)
  }
}

// GET /api/listings/:id/profitability
export async function rentabilidadeController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await obterRentabilidade(req.params.id, req.tenantId!)
    return res.json(successResponse(data))
  } catch (err) {
    return tratarErro(err, res, next)
  }
}

// GET /api/profitability — todos os produtos ordenados por margem
export async function listarRentabilidadesController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listarRentabilidades(req.tenantId!)
    return res.json(successResponse(data))
  } catch (err) {
    return next(err)
  }
}

// POST /api/listings/:id/profitability/analyze — enfileira a IA
export async function analisarRentController(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId } = await solicitarAnaliseIA(req.params.id, req.tenantId!)
    return res.status(202).json(successResponse({ jobId }))
  } catch (err) {
    return tratarErro(err, res, next)
  }
}

// GET /api/listings/:id/profitability/analyze/:jobId
export async function statusAnaliseRentController(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await consultarAnaliseIA(req.params.jobId, req.params.id, req.tenantId!)
    if (!status) return res.status(404).json(errorResponse('JOB_NAO_ENCONTRADO', 'Análise não encontrada'))
    return res.json(successResponse(status))
  } catch (err) {
    return next(err)
  }
}
