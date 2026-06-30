import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../lib/logger'

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Erros de validação Zod — detalhar campos inválidos
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDACAO_INVALIDA',
        message: 'Dados inválidos',
        details: err.flatten().fieldErrors,
      },
      meta: { timestamp: new Date().toISOString(), version: '1.0' },
    })
  }

  logger.error('Erro não tratado', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    tenantId: req.tenantId,
  })

  return res.status(500).json({
    success: false,
    data: null,
    error: { code: 'ERRO_INTERNO', message: 'Algo deu errado, tente novamente' },
    meta: { timestamp: new Date().toISOString(), version: '1.0' },
  })
}
