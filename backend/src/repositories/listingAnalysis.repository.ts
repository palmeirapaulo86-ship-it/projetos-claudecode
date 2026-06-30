import { prisma } from '../lib/prisma'
import type { TitleAnalysisOutput } from '../validations/titleAnalysis.validation'

interface SalvarAnaliseParams {
  tenantId: string
  listingId: string
  output: TitleAnalysisOutput
  rawResponse: string
}

// Persiste a análise e atualiza o titleScore do anúncio na mesma transação.
// Toda operação filtra por tenantId — sem exceção (sistema multi-tenant).
export async function salvarAnaliseDeTitulo({
  tenantId,
  listingId,
  output,
  rawResponse,
}: SalvarAnaliseParams) {
  return prisma.$transaction(async (tx) => {
    const analise = await tx.listingAnalysis.create({
      data: {
        tenantId,
        listingId,
        type: 'title_score',
        score: output.score,
        suggestions: {
          problemas: output.problemas,
          sugestoes: output.sugestoes,
          titulos_alternativos: output.titulos_alternativos,
        },
        rawResponse,
      },
    })

    // Atualiza só se o anúncio pertence ao tenant (updateMany evita vazamento entre tenants)
    await tx.listing.updateMany({
      where: { id: listingId, tenantId },
      data: { titleScore: output.score, lastAnalyzedAt: new Date() },
    })

    return analise
  })
}

// Confere que o anúncio existe e pertence ao tenant antes de enfileirar.
export async function listingPertenceAoTenant(listingId: string, tenantId: string) {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, tenantId, deletedAt: null },
    select: { id: true },
  })
  return listing !== null
}
