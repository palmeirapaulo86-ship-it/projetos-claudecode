import { prisma } from '../lib/prisma'

// Tenants distintos que têm anúncios do ML (alvos do polling de perguntas)
export async function tenantsComAnunciosML(): Promise<{ tenantId: string }[]> {
  const rows = await prisma.listing.findMany({
    where: { platform: 'mercadolivre', deletedAt: null },
    distinct: ['tenantId'],
    select: { tenantId: true },
  })
  return rows
}

// Acha o anúncio interno correspondente ao item do ML (para vincular a pergunta)
export async function acharListingPorExternalId(tenantId: string, externalId: string) {
  return prisma.listing.findFirst({
    where: { tenantId, platform: 'mercadolivre', externalId, deletedAt: null },
    select: { id: true, title: true, description: true },
  })
}

// Insere a pergunta se ainda não existe (idempotência pela unique tenantId+platform+externalId).
// Retorna a pergunta criada ou null se já existia.
export async function inserirPerguntaNova(params: {
  tenantId: string
  listingId: string
  externalId: string
  questionText: string
  buyerName: string | null
}) {
  const existe = await prisma.question.findFirst({
    where: { tenantId: params.tenantId, platform: 'mercadolivre', externalId: params.externalId },
    select: { id: true },
  })
  if (existe) return null

  return prisma.question.create({
    data: {
      tenantId: params.tenantId,
      listingId: params.listingId,
      platform: 'mercadolivre',
      externalId: params.externalId,
      questionText: params.questionText,
      buyerName: params.buyerName,
      status: 'pending',
    },
  })
}

// Salva a sugestão da IA na pergunta
export async function salvarSugestaoIA(params: {
  questionId: string
  suggestedAnswer: string
  confidence: number
  needsReview: boolean
}) {
  return prisma.question.update({
    where: { id: params.questionId },
    data: {
      suggestedAnswer: params.suggestedAnswer,
      aiConfidence: params.confidence,
      aiNeedsReview: params.needsReview,
      status: 'suggested',
    },
  })
}

// Lista perguntas por status (com checagem de tenant)
export async function listarPerguntas(tenantId: string, status?: string) {
  return prisma.question.findMany({
    where: { tenantId, ...(status ? { status } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

// Busca uma pergunta garantindo posse pelo tenant
export async function acharPergunta(questionId: string, tenantId: string) {
  return prisma.question.findFirst({ where: { id: questionId, tenantId } })
}

// Marca a pergunta como respondida após o envio ao ML
export async function marcarRespondida(params: {
  questionId: string
  answerText: string
  answeredBy: string
}) {
  return prisma.question.update({
    where: { id: params.questionId },
    data: {
      answerText: params.answerText,
      answeredBy: params.answeredBy,
      answeredAt: new Date(),
      status: 'answered',
    },
  })
}
