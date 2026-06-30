import { z } from 'zod'

// Schema do input do endpoint de análise de título
export const analyzeTitleInputSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório').max(200, 'Título muito longo'),
  category: z.string().max(120).optional(),
  keywords: z.array(z.string()).max(20).optional(),
})

export type AnalyzeTitleInput = z.infer<typeof analyzeTitleInputSchema>

// Schema do OUTPUT da IA — validado antes de salvar no banco.
// A IA às vezes erra o formato; isso garante que só dado válido prossegue.
export const titleAnalysisOutputSchema = z.object({
  score: z.number().int().min(0).max(100),
  problemas: z.array(z.string()),
  sugestoes: z.array(z.string()),
  titulos_alternativos: z.array(z.string()).min(1).max(3),
})

export type TitleAnalysisOutput = z.infer<typeof titleAnalysisOutputSchema>
