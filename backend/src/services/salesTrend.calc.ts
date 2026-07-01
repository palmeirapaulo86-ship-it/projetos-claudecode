// Detecção determinística de queda de vendas. A IA NÃO decide se caiu — só explica a causa.

export interface DailySalePoint {
  date: string // YYYY-MM-DD
  units: number
  revenue: number
}

export interface SalesTrend {
  totalUnits90: number
  unitsRecent30: number // últimos 30 dias
  unitsPrevious30: number // 30 dias anteriores a esses
  declinePercent: number // % de queda (positivo = caindo); 0 se não caiu
  hasDrop: boolean // true quando a queda passa do limiar
  avgDailyRecent: number
  avgDailyPrevious: number
  daysWithData: number
}

// Limiar de queda para acionar alerta (30 dias vs 30 dias anteriores)
const DROP_THRESHOLD_PERCENT = 25

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// Soma as unidades das vendas cuja data está dentro de [inicio, fim).
function somarJanela(sales: DailySalePoint[], inicio: Date, fim: Date): number {
  return sales.reduce((acc, s) => {
    const d = new Date(`${s.date}T00:00:00Z`)
    return d >= inicio && d < fim ? acc + s.units : acc
  }, 0)
}

// `hoje` é injetado para manter a função pura e testável (sem Date.now interno).
export function detectarQueda(sales: DailySalePoint[], hoje: Date): SalesTrend {
  const fimRecente = hoje
  const inicioRecente = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
  const inicioAnterior = new Date(hoje.getTime() - 60 * 24 * 60 * 60 * 1000)
  const inicio90 = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000)

  const unitsRecent30 = somarJanela(sales, inicioRecente, fimRecente)
  const unitsPrevious30 = somarJanela(sales, inicioAnterior, inicioRecente)
  const totalUnits90 = somarJanela(sales, inicio90, fimRecente)

  // Queda só faz sentido se havia vendas no período anterior
  const declineRaw =
    unitsPrevious30 > 0 ? ((unitsPrevious30 - unitsRecent30) / unitsPrevious30) * 100 : 0
  const declinePercent = declineRaw > 0 ? round2(declineRaw) : 0
  const hasDrop = unitsPrevious30 > 0 && declinePercent >= DROP_THRESHOLD_PERCENT

  return {
    totalUnits90,
    unitsRecent30,
    unitsPrevious30,
    declinePercent,
    hasDrop,
    avgDailyRecent: round2(unitsRecent30 / 30),
    avgDailyPrevious: round2(unitsPrevious30 / 30),
    daysWithData: sales.length,
  }
}
