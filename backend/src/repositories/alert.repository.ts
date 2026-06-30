import { prisma } from '../lib/prisma'
import type { Prisma } from '@prisma/client'

export async function criarAlerta(params: {
  tenantId: string
  type: string
  config: Prisma.InputJsonValue
}) {
  return prisma.alert.create({
    data: { tenantId: params.tenantId, type: params.type, config: params.config },
  })
}

export async function listarAlertas(tenantId: string) {
  return prisma.alert.findMany({
    where: { tenantId, isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}

// Alertas ativos de um tipo para um tenant (usado pelo motor de avaliação após cada coleta)
export async function alertasAtivosDoTipo(tenantId: string, type: string) {
  return prisma.alert.findMany({ where: { tenantId, type, isActive: true } })
}

export async function marcarAlertaDisparado(alertId: string) {
  return prisma.alert.update({ where: { id: alertId }, data: { lastFiredAt: new Date() } })
}
