import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  SUPABASE_URL: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter no mínimo 32 caracteres'),
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  // Proxy de scraping — opcional: sem ele o scraper roda com IP direto (só dev)
  BRIGHTDATA_USERNAME: z.string().optional(),
  BRIGHTDATA_PASSWORD: z.string().optional(),
  // Credenciais do Mercado Livre — opcionais até o OAuth por tenant existir (dev)
  ML_ACCESS_TOKEN: z.string().optional(),
  ML_SELLER_ID: z.string().optional(),
})

// Validar na inicialização — encerra o processo se faltar variável obrigatória
export function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('❌ Variáveis de ambiente inválidas:')
    console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2))
    process.exit(1)
  }
  return result.data
}
