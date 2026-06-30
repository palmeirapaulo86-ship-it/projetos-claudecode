import { prisma } from '../lib/prisma'
import type { ListingScraped } from '../validations/competitor.validation'

// Cria ou atualiza o concorrente (idempotente por listing + externalId) e grava no histórico.
// Roda em transação: a foto atual e a série temporal ficam sempre consistentes.
export async function registrarColeta(params: {
  tenantId: string
  listingId: string
  platform: string
  scraped: ListingScraped
}) {
  const { tenantId, listingId, platform, scraped } = params

  return prisma.$transaction(async (tx) => {
    const existente = await tx.competitor.findFirst({
      where: { tenantId, listingId, externalId: scraped.externalId },
      select: { id: true },
    })

    const competitor = existente
      ? await tx.competitor.update({
          where: { id: existente.id },
          data: {
            sellerName: scraped.sellerName,
            title: scraped.title,
            price: scraped.price,
            stock: scraped.stock,
            hasBuyBox: scraped.hasBuyBox,
          },
        })
      : await tx.competitor.create({
          data: {
            tenantId,
            listingId,
            externalId: scraped.externalId,
            platform,
            sellerName: scraped.sellerName,
            title: scraped.title,
            price: scraped.price,
            stock: scraped.stock,
            hasBuyBox: scraped.hasBuyBox,
          },
        })

    await tx.priceHistory.create({
      data: {
        competitorId: competitor.id,
        price: scraped.price,
        hasBuyBox: scraped.hasBuyBox,
      },
    })

    return competitor
  })
}

// Lista os concorrentes de um anúncio (com checagem de tenant)
export async function listarConcorrentes(listingId: string, tenantId: string) {
  return prisma.competitor.findMany({
    where: { listingId, tenantId },
    orderBy: [{ hasBuyBox: 'desc' }, { price: 'asc' }],
  })
}

// Histórico de preço de um concorrente nas últimas N horas (com checagem de tenant via join)
export async function historicoDePreco(competitorId: string, tenantId: string, horas: number) {
  const desde = new Date(Date.now() - horas * 60 * 60 * 1000)
  return prisma.priceHistory.findMany({
    where: {
      competitorId,
      capturedAt: { gte: desde },
      competitor: { tenantId }, // garante que o concorrente é do tenant
    },
    orderBy: { capturedAt: 'asc' },
    select: { price: true, hasBuyBox: true, capturedAt: true },
  })
}

// Todos os concorrentes ativos do sistema (usado pelo scheduler para enfileirar coletas)
export async function listarConcorrentesAtivos() {
  return prisma.competitor.findMany({
    select: { id: true, tenantId: true, listingId: true, externalId: true, platform: true },
  })
}

// Preço próprio do anúncio (para comparar com a concorrência nos alertas)
export async function precoDoAnuncio(listingId: string, tenantId: string) {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, tenantId, deletedAt: null },
    select: { price: true, title: true },
  })
  return listing
}
