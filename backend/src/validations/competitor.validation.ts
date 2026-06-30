import { z } from 'zod'

// Input para registrar um concorrente a monitorar (URL do anúncio no Mercado Livre)
export const addCompetitorInputSchema = z.object({
  url: z.string().url('URL inválida').refine((u) => u.includes('mercadolivre') || u.includes('mercadolibre'), {
    message: 'Por enquanto só monitoramos anúncios do Mercado Livre',
  }),
})
export type AddCompetitorInput = z.infer<typeof addCompetitorInputSchema>

// Input para configurar um alerta
export const createAlertInputSchema = z.object({
  type: z.enum(['price_drop', 'buy_box_lost']),
  config: z
    .object({
      // Para price_drop: dispara quando concorrente fica abaixo do preço próprio por essa margem (R$)
      thresholdReais: z.number().min(0).max(10000).optional(),
    })
    .default({}),
})
export type CreateAlertInput = z.infer<typeof createAlertInputSchema>

// Dado coletado pelo scraper — validado com Zod antes de sair do scraper (regra do scraper)
export const listingScrapedSchema = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0).nullable(),
  sellerName: z.string().min(1),
  hasBuyBox: z.boolean(),
})
export type ListingScraped = z.infer<typeof listingScrapedSchema>
