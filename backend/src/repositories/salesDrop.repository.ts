import { prisma } from '../lib/prisma'
import type { DailySalePoint } from '../services/salesTrend.calc'
import type { RegisterSaleInput } from '../validations/salesDrop.validation'

function toDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00Z`)
}
function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// Upsert idempotente por (listingId, date). Assume posse já validada no service.
export async function registrarVendas(
  tenantId: string,
  listingId: string,
  sales: RegisterSaleInput[]
) {
  await prisma.$transaction(
    sales.map((s) =>
      prisma.dailySale.upsert({
        where: { listingId_date: { listingId, date: toDate(s.date) } },
        create: { tenantId, listingId, date: toDate(s.date), units: s.units, revenue: s.revenue },
        update: { units: s.units, revenue: s.revenue },
      })
    )
  )
}

// Série de vendas dos últimos N dias (com checagem de tenant)
export async function vendasDoProduto(
  listingId: string,
  tenantId: string,
  dias: number
): Promise<DailySalePoint[]> {
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
  const rows = await prisma.dailySale.findMany({
    where: { listingId, tenantId, date: { gte: desde } },
    orderBy: { date: 'asc' },
    select: { date: true, units: true, revenue: true },
  })
  return rows.map((r) => ({ date: toYmd(r.date), units: r.units, revenue: Number(r.revenue) }))
}

// Produtos do tenant que têm vendas nos últimos 90 dias, com preço e série
export async function produtosComVendas(tenantId: string) {
  const desde = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const listings = await prisma.listing.findMany({
    where: { tenantId, deletedAt: null, dailySales: { some: { date: { gte: desde } } } },
    select: {
      id: true,
      title: true,
      price: true,
      dailySales: {
        where: { date: { gte: desde } },
        orderBy: { date: 'asc' },
        select: { date: true, units: true, revenue: true },
      },
    },
  })
  return listings.map((l) => ({
    listingId: l.id,
    title: l.title,
    price: Number(l.price),
    sales: l.dailySales.map((s) => ({ date: toYmd(s.date), units: s.units, revenue: Number(s.revenue) })),
  }))
}

export async function tituloEPreco(listingId: string, tenantId: string) {
  const l = await prisma.listing.findFirst({
    where: { id: listingId, tenantId, deletedAt: null },
    select: { title: true, price: true },
  })
  return l ? { title: l.title, price: Number(l.price) } : null
}

// Contexto de concorrência para enriquecer o diagnóstico da IA
export async function contextoConcorrencia(listingId: string, tenantId: string, precoProprio: number) {
  const concorrentes = await prisma.competitor.findMany({
    where: { listingId, tenantId },
    select: { price: true, hasBuyBox: true },
  })
  return {
    temConcorrenteMaisBarato: concorrentes.some((c) => Number(c.price) < precoProprio),
    perdeuBuyBox: concorrentes.some((c) => c.hasBuyBox),
  }
}
