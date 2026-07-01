import { describe, it, expect } from 'vitest'
import { detectarQueda, type DailySalePoint } from './salesTrend.calc'

const HOJE = new Date('2026-07-01T00:00:00Z')

// Gera vendas diárias com `units` por dia num intervalo [offsetInicio, offsetFim) dias atrás de HOJE
function gerarVendas(offsetInicio: number, offsetFim: number, units: number): DailySalePoint[] {
  const pontos: DailySalePoint[] = []
  for (let d = offsetInicio; d < offsetFim; d++) {
    const data = new Date(HOJE.getTime() - d * 24 * 60 * 60 * 1000)
    pontos.push({ date: data.toISOString().slice(0, 10), units, revenue: units * 10 })
  }
  return pontos
}

describe('detectarQueda', () => {
  it('detecta queda quando os últimos 30 dias caem além do limiar', () => {
    // 30 dias anteriores: 10/dia (300) | últimos 30 dias: 3/dia (90) → queda de 70%
    const sales = [...gerarVendas(30, 60, 10), ...gerarVendas(0, 30, 3)]
    const t = detectarQueda(sales, HOJE)

    expect(t.unitsPrevious30).toBe(300)
    expect(t.unitsRecent30).toBe(90)
    expect(t.declinePercent).toBe(70)
    expect(t.hasDrop).toBe(true)
  })

  it('não acusa queda quando as vendas se mantêm', () => {
    const sales = [...gerarVendas(30, 60, 8), ...gerarVendas(0, 30, 8)]
    const t = detectarQueda(sales, HOJE)

    expect(t.declinePercent).toBe(0)
    expect(t.hasDrop).toBe(false)
  })

  it('não acusa queda de produto novo sem histórico anterior', () => {
    // Só vendas nos últimos 30 dias; período anterior é zero → não há base de comparação
    const sales = gerarVendas(0, 30, 5)
    const t = detectarQueda(sales, HOJE)

    expect(t.unitsPrevious30).toBe(0)
    expect(t.hasDrop).toBe(false)
  })
})
