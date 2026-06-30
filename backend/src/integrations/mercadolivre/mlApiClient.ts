import { z } from 'zod'
import { logger } from '../../lib/logger'

const ML_BASE = 'https://api.mercadolibre.com'

// Schemas dos retornos da API do ML — validados antes de usar
const recebidaSchema = z.object({
  id: z.number(),
  text: z.string(),
  status: z.string(),
  item_id: z.string(),
  date_created: z.string(),
  from: z.object({ id: z.number() }).optional(),
})
const buscaPerguntasSchema = z.object({
  questions: z.array(recebidaSchema).default([]),
})

export interface PerguntaML {
  externalId: string
  itemId: string
  text: string
  buyerId: string | null
  dateCreated: string
}

async function mlFetch(path: string, token: string, init?: RequestInit): Promise<Response> {
  return fetch(`${ML_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

// Busca perguntas NÃO respondidas recebidas pelo vendedor (API oficial do ML).
export async function buscarPerguntasNaoRespondidas(token: string, sellerId: string): Promise<PerguntaML[]> {
  const res = await mlFetch(
    `/my/received_questions/search?status=UNANSWERED&limit=50&seller_id=${encodeURIComponent(sellerId)}`,
    token
  )
  if (!res.ok) {
    logger.warn('ML API: falha ao buscar perguntas', { status: res.status })
    throw new Error(`ML API respondeu ${res.status}`)
  }
  const json = buscaPerguntasSchema.parse(await res.json())
  return json.questions.map((q) => ({
    externalId: String(q.id),
    itemId: q.item_id,
    text: q.text,
    buyerId: q.from ? String(q.from.id) : null,
    dateCreated: q.date_created,
  }))
}

// Busca título e descrição de um item para dar contexto à IA.
const itemSchema = z.object({ id: z.string(), title: z.string() })
export async function buscarItem(token: string, itemId: string): Promise<{ title: string; description: string }> {
  const [itemRes, descRes] = await Promise.all([
    mlFetch(`/items/${itemId}`, token),
    mlFetch(`/items/${itemId}/description`, token),
  ])
  const item = itemRes.ok ? itemSchema.partial().parse(await itemRes.json()) : { title: '' }
  const desc = descRes.ok ? ((await descRes.json()) as { plain_text?: string }) : {}
  return { title: item.title ?? '', description: desc.plain_text ?? '' }
}

// Envia a resposta da pergunta via API oficial do ML.
export async function responderPerguntaML(token: string, questionId: string, text: string): Promise<void> {
  const res = await mlFetch('/answers', token, {
    method: 'POST',
    body: JSON.stringify({ question_id: Number(questionId), text }),
  })
  if (!res.ok) {
    const corpo = await res.text().catch(() => '')
    logger.error('ML API: falha ao enviar resposta', { status: res.status, corpo })
    throw new Error(`Não foi possível enviar a resposta ao Mercado Livre (${res.status})`)
  }
}
