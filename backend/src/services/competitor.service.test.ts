import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../repositories/listingAnalysis.repository', () => ({
  listingPertenceAoTenant: vi.fn(),
}))
vi.mock('../repositories/competitor.repository', () => ({
  listarConcorrentes: vi.fn(),
  historicoDePreco: vi.fn(),
  precoDoAnuncio: vi.fn(),
}))
vi.mock('../repositories/alert.repository', () => ({
  criarAlerta: vi.fn(),
  listarAlertas: vi.fn(),
}))
vi.mock('../jobs/priceMonitor.job', () => ({ enfileirarColetaImediata: vi.fn() }))

import { listingPertenceAoTenant } from '../repositories/listingAnalysis.repository'
import { listarConcorrentes, precoDoAnuncio } from '../repositories/competitor.repository'
import { enfileirarColetaImediata } from '../jobs/priceMonitor.job'
import {
  adicionarConcorrente,
  listarConcorrentesComComparacao,
} from './competitor.service'
import { ListingNaoEncontradoError } from './listing.service'

beforeEach(() => vi.clearAllMocks())

describe('adicionarConcorrente', () => {
  it('extrai o MLB da URL e enfileira a coleta', async () => {
    vi.mocked(listingPertenceAoTenant).mockResolvedValue(true)
    vi.mocked(enfileirarColetaImediata).mockResolvedValue('job-9')

    const res = await adicionarConcorrente('l-1', 't-1', {
      url: 'https://produto.mercadolivre.com.br/MLB-1234567890-fone',
    })

    expect(res.externalId).toBe('MLB1234567890')
    expect(res.jobId).toBe('job-9')
  })

  it('rejeita quando o anúncio não é do tenant', async () => {
    vi.mocked(listingPertenceAoTenant).mockResolvedValue(false)
    await expect(
      adicionarConcorrente('l-x', 't-1', { url: 'https://mercadolivre.com.br/MLB-1' })
    ).rejects.toBeInstanceOf(ListingNaoEncontradoError)
  })
})

describe('listarConcorrentesComComparacao', () => {
  it('sinaliza quando o preço próprio está acima da concorrência', async () => {
    vi.mocked(listingPertenceAoTenant).mockResolvedValue(true)
    vi.mocked(precoDoAnuncio).mockResolvedValue({ price: 100 as never, title: 'Meu' })
    vi.mocked(listarConcorrentes).mockResolvedValue([
      { id: 'c1', sellerName: 'A', title: 'X', price: 90 as never, stock: 5, hasBuyBox: true, updatedAt: new Date() },
    ] as never)

    const res = await listarConcorrentesComComparacao('l-1', 't-1')

    expect(res.acimaDaConcorrencia).toBe(true)
    expect(res.menorPrecoConcorrente).toBe(90)
    expect(res.competitors[0].price).toBe(90)
  })
})
