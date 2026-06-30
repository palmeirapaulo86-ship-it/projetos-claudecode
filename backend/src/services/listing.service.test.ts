import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocka as dependências externas (banco e fila) — o teste cobre só a lógica do service
vi.mock('../repositories/listingAnalysis.repository', () => ({
  listingPertenceAoTenant: vi.fn(),
}))
vi.mock('../jobs/titleAnalysis.job', () => ({
  enfileirarAnaliseDeTitulo: vi.fn(),
}))
vi.mock('../lib/bull', () => ({ aiAnalysisQueue: { getJob: vi.fn() } }))

import { listingPertenceAoTenant } from '../repositories/listingAnalysis.repository'
import { enfileirarAnaliseDeTitulo } from '../jobs/titleAnalysis.job'
import { aiAnalysisQueue } from '../lib/bull'
import {
  solicitarAnaliseDeTitulo,
  consultarStatusAnalise,
  ListingNaoEncontradoError,
} from './listing.service'

const input = { title: 'Fone Bluetooth' }

beforeEach(() => vi.clearAllMocks())

describe('solicitarAnaliseDeTitulo', () => {
  it('enfileira e retorna jobId quando o anúncio pertence ao tenant', async () => {
    vi.mocked(listingPertenceAoTenant).mockResolvedValue(true)
    vi.mocked(enfileirarAnaliseDeTitulo).mockResolvedValue('job-1')

    const res = await solicitarAnaliseDeTitulo('listing-1', 'tenant-1', input)

    expect(res).toEqual({ jobId: 'job-1' })
    expect(enfileirarAnaliseDeTitulo).toHaveBeenCalledWith({
      ...input,
      tenantId: 'tenant-1',
      listingId: 'listing-1',
    })
  })

  // Caminho de erro: não basta testar só o happy path
  it('lança erro quando o anúncio não pertence ao tenant', async () => {
    vi.mocked(listingPertenceAoTenant).mockResolvedValue(false)

    await expect(solicitarAnaliseDeTitulo('listing-x', 'tenant-1', input)).rejects.toBeInstanceOf(
      ListingNaoEncontradoError
    )
    expect(enfileirarAnaliseDeTitulo).not.toHaveBeenCalled()
  })
})

describe('consultarStatusAnalise', () => {
  it('bloqueia acesso a job de outro tenant (anti-vazamento multi-tenant)', async () => {
    vi.mocked(aiAnalysisQueue.getJob).mockResolvedValue({
      data: { tenantId: 'OUTRO', listingId: 'listing-1' },
    } as never)

    const res = await consultarStatusAnalise('job-1', 'listing-1', 'tenant-1')

    expect(res).toBeNull()
  })

  it('retorna done com o resultado quando o job completou', async () => {
    const result = { analysisId: 'a-1', output: { score: 80 } }
    vi.mocked(aiAnalysisQueue.getJob).mockResolvedValue({
      data: { tenantId: 'tenant-1', listingId: 'listing-1' },
      getState: vi.fn().mockResolvedValue('completed'),
      returnvalue: result,
    } as never)

    const res = await consultarStatusAnalise('job-1', 'listing-1', 'tenant-1')

    expect(res).toEqual({ status: 'done', result })
  })
})
