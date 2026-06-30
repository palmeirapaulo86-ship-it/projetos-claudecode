import { ListingNaoEncontradoError } from './listing.service'
import { listingPertenceAoTenant } from '../repositories/listingAnalysis.repository'
import {
  listarConcorrentes,
  historicoDePreco,
  precoDoAnuncio,
} from '../repositories/competitor.repository'
import { criarAlerta, listarAlertas } from '../repositories/alert.repository'
import { enfileirarColetaImediata } from '../jobs/priceMonitor.job'
import { extrairExternalId } from '../integrations/mercadolivre/priceScraper'
import type { AddCompetitorInput, CreateAlertInput } from '../validations/competitor.validation'

// Adiciona um concorrente a monitorar e dispara uma coleta imediata.
export async function adicionarConcorrente(
  listingId: string,
  tenantId: string,
  input: AddCompetitorInput
): Promise<{ jobId: string; externalId: string }> {
  if (!(await listingPertenceAoTenant(listingId, tenantId))) {
    throw new ListingNaoEncontradoError()
  }
  const externalId = extrairExternalId(input.url)
  const jobId = await enfileirarColetaImediata({
    competitorId: externalId, // ainda não existe linha; o externalId serve de chave no Redis
    tenantId,
    listingId,
    externalId,
    platform: 'mercadolivre',
  })
  return { jobId, externalId }
}

// Lista concorrentes já com a comparação contra o preço próprio do anúncio.
export async function listarConcorrentesComComparacao(listingId: string, tenantId: string) {
  if (!(await listingPertenceAoTenant(listingId, tenantId))) {
    throw new ListingNaoEncontradoError()
  }
  const [concorrentes, anuncio] = await Promise.all([
    listarConcorrentes(listingId, tenantId),
    precoDoAnuncio(listingId, tenantId),
  ])

  const precoProprio = anuncio ? Number(anuncio.price) : null
  const menorPreco = concorrentes.reduce<number | null>(
    (min, c) => (min === null ? Number(c.price) : Math.min(min, Number(c.price))),
    null
  )

  return {
    precoProprio,
    menorPrecoConcorrente: menorPreco,
    // true quando meu preço está acima do menor concorrente (alerta visual no front)
    acimaDaConcorrencia: precoProprio !== null && menorPreco !== null && precoProprio > menorPreco,
    competitors: concorrentes.map((c) => ({
      id: c.id,
      sellerName: c.sellerName,
      title: c.title,
      price: Number(c.price),
      stock: c.stock,
      hasBuyBox: c.hasBuyBox,
      updatedAt: c.updatedAt,
    })),
  }
}

export async function obterHistorico(
  competitorId: string,
  tenantId: string,
  horas: number
) {
  const pontos = await historicoDePreco(competitorId, tenantId, horas)
  return pontos.map((p) => ({
    price: Number(p.price),
    hasBuyBox: p.hasBuyBox,
    capturedAt: p.capturedAt,
  }))
}

export async function configurarAlerta(
  listingId: string,
  tenantId: string,
  input: CreateAlertInput
) {
  if (!(await listingPertenceAoTenant(listingId, tenantId))) {
    throw new ListingNaoEncontradoError()
  }
  return criarAlerta({ tenantId, type: input.type, config: { listingId, ...input.config } })
}

export async function listarAlertasDoTenant(tenantId: string) {
  return listarAlertas(tenantId)
}
