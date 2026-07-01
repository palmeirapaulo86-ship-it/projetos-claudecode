// Cálculo determinístico de rentabilidade. A IA NÃO faz conta — só interpreta esses números.

export interface CostInputs {
  price: number // preço de venda do anúncio
  productCost: number
  shippingCost: number
  platformFeePercent: number // %
  returnRatePercent: number // %
}

export interface ProfitabilityResult {
  price: number
  platformFeeValue: number // R$ da taxa
  returnLossValue: number // R$ de perda esperada por devoluções
  totalCost: number
  netProfit: number // lucro líquido por unidade (R$)
  marginPercent: number // margem sobre a receita (%)
  breakEvenPrice: number // preço mínimo para lucro zero (R$)
  isLoss: boolean // true quando está no prejuízo
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function calcularRentabilidade(input: CostInputs): ProfitabilityResult {
  const price = input.price
  const feePct = input.platformFeePercent / 100
  const returnPct = input.returnRatePercent / 100

  const platformFeeValue = price * feePct
  // Perda esperada por devoluções: fração das vendas que volta, perdendo produto + frete
  const returnLossValue = (input.productCost + input.shippingCost) * returnPct
  const totalCost = input.productCost + input.shippingCost + platformFeeValue + returnLossValue

  const netProfit = price - totalCost
  const marginPercent = price > 0 ? (netProfit / price) * 100 : 0

  // Ponto de equilíbrio: preço P tal que P - P*taxa - produto - frete - devolução = 0
  // → P = (produto + frete + devolução) / (1 - taxa)
  const custosNaoProporcionais = input.productCost + input.shippingCost + returnLossValue
  const breakEvenPrice = feePct < 1 ? custosNaoProporcionais / (1 - feePct) : Infinity

  return {
    price: round2(price),
    platformFeeValue: round2(platformFeeValue),
    returnLossValue: round2(returnLossValue),
    totalCost: round2(totalCost),
    netProfit: round2(netProfit),
    marginPercent: round2(marginPercent),
    breakEvenPrice: Number.isFinite(breakEvenPrice) ? round2(breakEvenPrice) : 0,
    isLoss: netProfit < 0,
  }
}
