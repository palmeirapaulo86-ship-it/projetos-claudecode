// Resolução das credenciais do Mercado Livre por tenant.
//
// NOTA: o fluxo OAuth completo do ML (armazenar token/refresh por tenant) é uma feature
// futura. Até lá, usamos um token de ambiente para desenvolvimento. A interface já é
// assíncrona e recebe tenantId para que a troca pela busca no banco seja transparente.

export interface MlCredentials {
  accessToken: string
  sellerId: string
}

export async function getMlCredentials(_tenantId: string): Promise<MlCredentials | null> {
  const accessToken = process.env.ML_ACCESS_TOKEN
  const sellerId = process.env.ML_SELLER_ID
  if (!accessToken || !sellerId) return null
  return { accessToken, sellerId }
}
