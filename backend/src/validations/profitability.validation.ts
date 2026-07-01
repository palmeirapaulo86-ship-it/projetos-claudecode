import { z } from 'zod'

// Input para cadastrar/atualizar os custos de um produto
export const upsertCostInputSchema = z.object({
  productCost: z.number().min(0, 'Custo inválido').max(1_000_000),
  shippingCost: z.number().min(0).max(1_000_000),
  platformFeePercent: z.number().min(0).max(100),
  returnRatePercent: z.number().min(0).max(100).default(0),
})
export type UpsertCostInput = z.infer<typeof upsertCostInputSchema>

// Saída da IA — apenas o texto (os números são calculados em código)
export const profitabilityAiOutputSchema = z.object({
  analise: z.string().min(1).max(800),
  recomendacao: z.string().min(1).max(800),
  urgencia: z.enum(['baixa', 'media', 'alta']),
})
export type ProfitabilityAiOutput = z.infer<typeof profitabilityAiOutputSchema>
