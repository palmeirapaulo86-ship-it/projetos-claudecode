import { Request, Response, NextFunction } from 'express'
import { successResponse, errorResponse } from '../types'
import { registerSalesBulkSchema, registerSaleInputSchema } from '../validations/salesDrop.validation'
import {
  registrarVendas,
  obterTendencia,
  listarQuedas,
  solicitarDiagnostico,
  consultarDiagnostico,
} from '../services/salesDrop.service'
import { ListingNaoEncontradoError } from '../services/listing.service'

function tratarErro(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof ListingNaoEncontradoError)
    return res.status(404).json(errorResponse('LISTING_NAO_ENCONTRADO', err.message))
  return next(err)
}

// POST /api/listings/:id/sales — aceita uma venda ou um lote { sales: [...] }
export async function registrarVendasController(req: Request, res: Response, next: NextFunction) {
  try {
    const body = Array.isArray(req.body?.sales)
      ? registerSalesBulkSchema.parse(req.body).sales
      : [registerSaleInputSchema.parse(req.body)]
    const result = await registrarVendas(req.params.id, req.tenantId!, body)
    return res.status(201).json(successResponse(result))
  } catch (err) {
    return tratarErro(err, res, next)
  }
}

// GET /api/listings/:id/sales — série + tendência
export async function tendenciaController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await obterTendencia(req.params.id, req.tenantId!)
    return res.json(successResponse(data))
  } catch (err) {
    return tratarErro(err, res, next)
  }
}

// GET /api/sales/trends — todos os produtos, quedas primeiro
export async function listarQuedasController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listarQuedas(req.tenantId!)
    return res.json(successResponse(data))
  } catch (err) {
    return next(err)
  }
}

// POST /api/listings/:id/diagnosis — enfileira a IA
export async function diagnosticarController(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId } = await solicitarDiagnostico(req.params.id, req.tenantId!)
    return res.status(202).json(successResponse({ jobId }))
  } catch (err) {
    return tratarErro(err, res, next)
  }
}

// GET /api/listings/:id/diagnosis/:jobId
export async function statusDiagnosticoController(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await consultarDiagnostico(req.params.jobId, req.params.id, req.tenantId!)
    if (!status) return res.status(404).json(errorResponse('JOB_NAO_ENCONTRADO', 'Diagnóstico não encontrado'))
    return res.json(successResponse(status))
  } catch (err) {
    return next(err)
  }
}
