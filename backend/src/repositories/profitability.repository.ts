import { prisma } from '../lib/prisma'
import type { UpsertCostInput } from '../validations/profitability.validation'

// Cria ou atualiza os custos do anúncio (um por listing). Assume posse já validada no service.
export async function upsertCustos(tenantId: string, listingId: string, input: UpsertCostInput) {
  return prisma.productCost.upsert({
    where: { listingId },
    create: { tenantId, listingId, ...input },
    update: { ...input },
  })
}

// Anúncio + custos (com checagem de tenant). Retorna null se não houver custos cadastrados.
export async function listingComCustos(listingId: string, tenantId: string) {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, tenantId, deletedAt: null },
    select: { id: true, title: true, price: true, productCost: true },
  })
  if (!listing || !listing.productCost) return null
  return {
    title: listing.title,
    price: Number(listing.price),
    productCost: Number(listing.productCost.productCost),
    shippingCost: Number(listing.productCost.shippingCost),
    platformFeePercent: Number(listing.productCost.platformFeePercent),
    returnRatePercent: Number(listing.productCost.returnRatePercent),
  }
}

// Todos os produtos do tenant que têm custos cadastrados (para a tabela ordenada por margem)
export async function listingsComCustos(tenantId: string) {
  const listings = await prisma.listing.findMany({
    where: { tenantId, deletedAt: null, productCost: { isNot: null } },
    select: { id: true, title: true, price: true, productCost: true },
  })
  return listings.map((l) => ({
    listingId: l.id,
    title: l.title,
    price: Number(l.price),
    productCost: Number(l.productCost!.productCost),
    shippingCost: Number(l.productCost!.shippingCost),
    platformFeePercent: Number(l.productCost!.platformFeePercent),
    returnRatePercent: Number(l.productCost!.returnRatePercent),
  }))
}

export async function criarSnapshot(params: {
  tenantId: string
  listingId: string
  netProfit: number
  marginPercent: number
}) {
  return prisma.profitabilitySnapshot.create({ data: params })
}

// Histórico de margem dos últimos N dias (com checagem de tenant)
export async function historicoMargem(listingId: string, tenantId: string, dias: number) {
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
  return prisma.profitabilitySnapshot.findMany({
    where: { listingId, tenantId, capturedAt: { gte: desde } },
    orderBy: { capturedAt: 'asc' },
    select: { netProfit: true, marginPercent: true, capturedAt: true },
  })
}
