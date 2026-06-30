import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { errorResponse } from '../types'

// Estender o tipo Request do Express para incluir dados do usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: string }
      tenantId?: string
    }
  }
}

interface JwtPayload {
  userId: string
  tenantId: string
}

export async function autenticarUsuario(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json(errorResponse('TOKEN_AUSENTE', 'Autenticação necessária'))
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload

    const user = await prisma.user.findFirst({
      where: { id: payload.userId, tenantId: payload.tenantId, deletedAt: null },
    })

    if (!user) {
      return res.status(401).json(errorResponse('USUARIO_NAO_ENCONTRADO', 'Sessão inválida'))
    }

    req.user = { id: user.id, email: user.email, role: user.role }
    req.tenantId = user.tenantId
    next()
  } catch (err) {
    logger.warn('Token JWT inválido', { path: req.path })
    return res.status(401).json(errorResponse('TOKEN_INVALIDO', 'Sessão expirada, faça login novamente'))
  }
}
