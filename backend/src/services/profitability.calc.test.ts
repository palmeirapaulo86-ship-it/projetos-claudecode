import { describe, it, expect } from 'vitest'
import { calcularRentabilidade } from './profitability.calc'

describe('calcularRentabilidade', () => {
  it('calcula lucro, margem e ponto de equilíbrio de um produto no lucro', () => {
    // Preço 100, produto 40, frete 10, taxa 12%, sem devoluções
    const r = calcularRentabilidade({
      price: 100,
      productCost: 40,
      shippingCost: 10,
      platformFeePercent: 12,
      returnRatePercent: 0,
    })
    // taxa = 12; custo total = 40+10+12 = 62; lucro = 38; margem = 38%
    expect(r.platformFeeValue).toBe(12)
    expect(r.totalCost).toBe(62)
    expect(r.netProfit).toBe(38)
    expect(r.marginPercent).toBe(38)
    expect(r.isLoss).toBe(false)
    // ponto de equilíbrio = (40+10)/(1-0.12) = 56.82
    expect(r.breakEvenPrice).toBeCloseTo(56.82, 1)
  })

  it('detecta prejuízo quando os custos superam o preço', () => {
    const r = calcularRentabilidade({
      price: 50,
      productCost: 45,
      shippingCost: 12,
      platformFeePercent: 15,
      returnRatePercent: 0,
    })
    expect(r.netProfit).toBeLessThan(0)
    expect(r.isLoss).toBe(true)
  })

  it('inclui a perda por devoluções no custo', () => {
    const semDevolucao = calcularRentabilidade({
      price: 100, productCost: 40, shippingCost: 10, platformFeePercent: 10, returnRatePercent: 0,
    })
    const comDevolucao = calcularRentabilidade({
      price: 100, productCost: 40, shippingCost: 10, platformFeePercent: 10, returnRatePercent: 20,
    })
    // devolução de 20% sobre (40+10)=50 → perde 10 a mais
    expect(comDevolucao.netProfit).toBeCloseTo(semDevolucao.netProfit - 10, 2)
  })
})
