import { prisma } from '../lib/prisma'

export async function criarAutoReply(params: {
  tenantId: string
  keyword: string
  response: string
  useAi: boolean
}) {
  return prisma.autoReply.create({ data: params })
}

export async function listarAutoReplies(tenantId: string) {
  return prisma.autoReply.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } })
}

// Regras ativas de IA do tenant (usadas para decidir auto-envio)
export async function regrasDeAutoRespostaIA(tenantId: string) {
  return prisma.autoReply.findMany({ where: { tenantId, useAi: true } })
}

export async function incrementarUso(autoReplyId: string) {
  return prisma.autoReply.update({
    where: { id: autoReplyId },
    data: { timesUsed: { increment: 1 } },
  })
}
