import { z } from 'zod'

// Saída da IA — validada com Zod antes de salvar (a IA às vezes erra o formato)
export const questionAnswerOutputSchema = z.object({
  categoria: z.enum(['frete', 'estoque', 'caracteristicas', 'pagamento', 'garantia', 'outro']),
  resposta: z.string().min(1).max(500),
  confianca: z.number().min(0).max(1),
  requer_revisao_humana: z.boolean(),
  motivo_revisao: z.string().nullable(),
})
export type QuestionAnswerOutput = z.infer<typeof questionAnswerOutputSchema>

// Input para editar/enviar uma resposta manualmente
export const sendAnswerInputSchema = z.object({
  text: z.string().min(1, 'A resposta não pode ser vazia').max(2000),
})
export type SendAnswerInput = z.infer<typeof sendAnswerInputSchema>

// Input para criar uma regra de auto-resposta
export const createAutoReplyInputSchema = z.object({
  keyword: z.string().min(1).max(120),
  response: z.string().max(2000).default(''),
  useAi: z.boolean().default(true),
})
export type CreateAutoReplyInput = z.infer<typeof createAutoReplyInputSchema>
