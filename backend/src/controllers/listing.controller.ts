import { Request, Response, NextFunction } from 'express'
import { successResponse, errorResponse } from '../types'
import { analyzeTitleInputSchema } from '../validations/titleAnalysis.validation'
import {
  solicitarAnaliseDeTitulo,
  consultarStatusAnalise,
  ListingNaoEncontradoError,
} from '../services/listing.service'

// POST /api/listings/:id/analyze/title — enfileira a análise e devolve o jobId
export async function analisarTituloController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = analyzeTitleInputSchema.parse(req.body) // Zod lança → tratado no errorHandler
    const { jobId } = await solicitarAnaliseDeTitulo(req.params.id, req.tenantId!, input)
    return res.status(202).json(successResponse({ jobId }))
  } catch (err) {
    if (err instanceof ListingNaoEncontradoError) {
      return res.status(404).json(errorResponse('LISTING_NAO_ENCONTRADO', err.message))
    }
    return next(err)
  }
}

// GET /api/listings/:id/analyze/title/:jobId — status/resultado da análise
export async function statusAnaliseController(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await consultarStatusAnalise(req.params.jobId, req.params.id, req.tenantId!)
    if (!status) {
      return res.status(404).json(errorResponse('JOB_NAO_ENCONTRADO', 'Análise não encontrada'))
    }
    return res.json(successResponse(status))
  } catch (err) {
    return next(err)
  }
}
