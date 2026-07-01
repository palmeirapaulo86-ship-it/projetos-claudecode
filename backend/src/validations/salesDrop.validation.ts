import { z } from 'zod'

// Registro de venda de um dia (ou vários em lote)
export const registerSaleInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD'),
  units: z.number().int().min(0).max(1_000_000),
  revenue: z.number().min(0).max(100_000_000).default(0),
})
export type RegisterSaleInput = z.infer<typeof registerSaleInputSchema>

export const registerSalesBulkSchema = z.object({
  sales: z.array(registerSaleInputSchema).min(1).max(366),
})

// Saída da IA — só o texto do diagnóstico (a detecção de queda é feita em código)
export const salesDiagnosisOutputSchema = z.object({
  causa_provavel: z.string().min(1).max(600),
  evidencias: z.array(z.string()).max(6),
  acoes_recomendadas: z.array(z.string()).min(1).max(6),
  urgencia: z.enum(['baixa', 'media', 'alta']),
})
export type SalesDiagnosisOutput = z.infer<typeof salesDiagnosisOutputSchema>
