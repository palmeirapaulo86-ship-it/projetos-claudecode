# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Marketplace Copilot — Cérebro do Projeto

## O que é esse produto
SaaS B2B para vendedores do Mercado Livre, Amazon e Shopee.
Funciona como um analista de marketplace sênior disponível 24h.
Cobra R$197–397/mês por conta conectada.
Meta: 100 clientes pagantes em 6 meses = R$30k MRR mínimo.

## Stack obrigatória (não mudar sem decisão do strategic-ceo)
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Node.js + Express + TypeScript + Prisma ORM
- Banco de dados: PostgreSQL via Supabase + Redis para cache
- IA: Anthropic Claude API (modelo claude-sonnet-4-6 sempre)
- Scraping: Playwright + fila Bull + proxy BrightData
- Autenticação: Supabase Auth (email/senha + Google OAuth)
- Pagamentos: Stripe (planos mensais recorrentes)
- Deploy: Vercel para frontend, Railway para backend
- Testes: Vitest (unitários) + Playwright (e2e)

## Regras absolutas — nunca violar
1. NUNCA commitar código sem rodar os testes antes
2. NUNCA colocar chave de API, senha ou segredo no código — sempre em variável de ambiente (.env)
3. Todo endpoint de API precisa ter: autenticação + validação de input + rate limiting
4. Em sistema multi-tenant: TODA query no banco filtra por tenant_id — sem exceção
5. Scraping e processamento de IA nunca são síncronos — sempre usar fila (Bull)
6. Migration de banco de dados: nunca deletar coluna, apenas depreciar
7. Todo componente React precisa de três estados: loading, error e empty
8. Código escrito em inglês, comentários em português

## Dores reais do usuário (nunca perder o foco disso)
- Perde o "buy box" por diferença de R$0,50 no preço e não sabe
- Título e ficha técnica ruins derrubam a conversão sem avisar
- Responde 80 perguntas iguais no chat manualmente todo dia
- Não sabe qual produto está dando prejuízo depois do frete e taxa
- Concorrente baixa preço à noite e ele percebe só de manhã

## Funcionalidades prioritárias (construir nessa ordem)
1. Análise de título e ficha técnica com score 0-100 e sugestões da IA
2. Monitor de preço de concorrentes com alerta em tempo real
3. Resposta automática de perguntas frequentes com IA
4. Dashboard de rentabilidade real por produto (receita - frete - taxa - custo)
5. Detector de padrão de queda de vendas com causa provável

## Agentes disponíveis nesse projeto
Todos os agentes estão em .claude/agents/ — ler antes de começar qualquer tarefa:
- strategic-ceo: valida se vale a pena construir cada feature
- frontend: cria toda a interface do usuário
- backend: cria APIs, lógica de negócio e integrações
- database: cria schemas, migrations e queries
- ai-engine: cria pipelines de IA e prompts
- scraper: coleta dados do ML, Amazon e Shopee
- qa-reviewer: valida tudo antes do merge — obrigatório

## Fluxo de trabalho obrigatório para toda feature nova
1. strategic-ceo valida se a feature deve ser construída
2. database cria o schema e migration
3. backend cria os endpoints e lógica
4. ai-engine cria o pipeline de IA (se aplicável)
5. scraper cria a coleta de dados (se aplicável)
6. frontend cria a interface
7. qa-reviewer valida tudo
8. Commitar com mensagem descritiva em português

## Formato padrão de resposta da API
Sempre retornar JSON nesse formato:
```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "2025-01-01T00:00:00Z",
    "version": "1.0"
  }
}
```

## Comandos de desenvolvimento
Backend (pasta `backend/`): `npm run dev` (tsx watch), `npm run build`, `npm run test` (Vitest), `npm run test:run`, `npm run prisma:migrate`, `npm run prisma:generate`.
Frontend (pasta `frontend/`): `npm run dev`, `npm run build`, `npm run lint`, `npm run test`.
Rodar um único teste backend: `npx vitest run src/services/listing.service.test.ts`.

## Estado atual (features construídas)
- **Estrutura base**: backend Express (`backend/src/`) com lib (prisma, redis, bull, logger, env), middleware (auth JWT, rate limit, errorHandler) e schema Prisma completo. Frontend Next.js 14 com login, dashboard, layout autenticado e componentes shared (ErrorBoundary, Skeleton, Providers).
- **Feature 1 — Análise de Título com IA** (completa): `POST /api/listings/:id/analyze/title` enfileira na `aiAnalysisQueue` (Bull) e retorna jobId; `GET /api/listings/:id/analyze/title/:jobId` faz o polling do resultado (com checagem anti-vazamento por tenantId). Pipeline de IA em `backend/src/services/ai/titleAnalysis.pipeline.ts` (cache Redis 24h + retry único + validação Zod, modelo `claude-sonnet-4-6`). Tela em `frontend/src/app/(dashboard)/analyze-title/` com ScoreCircle visual.
- **Feature 2 — Monitor de Preço de Concorrentes** (completa): scraper Playwright do Mercado Livre em `backend/src/integrations/mercadolivre/priceScraper.ts` (anti-bloqueio: proxy BrightData opcional, UA rotativo, detecção de CAPTCHA). Job `backend/src/jobs/priceMonitor.job.ts`: tick recorrente Bull a cada 30 min enfileira uma coleta por concorrente → grava bruto no Redis (24h) → consolida em `competitors`/`price_history` → motor de alertas (price_drop, buy_box_lost) via `notificationQueue`. Endpoints: `POST/GET /api/listings/:id/competitors`, `GET /api/competitors/:id/price-history?hours=24`, `POST/GET /api/listings/:id/alerts`. Dashboard em `frontend/src/app/(dashboard)/price-monitor/` com tabela de concorrentes, badge de buy box, gráfico 24h (recharts) e alerta visual de preço acima da concorrência.

## Padrão de IA (ai-engine)
Cliente Anthropic em `backend/src/lib/anthropic.ts`; modelo sempre `claude-sonnet-4-6` (constante `CLAUDE_MODEL`). Todo pipeline: cache → prompt → API → `extrairJSON` → validação Zod → cache. Output da IA sempre JSON estruturado validado por Zod antes de salvar.

## Variáveis de ambiente necessárias (criar .env.example)
```
DATABASE_URL=
REDIS_URL=
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
BRIGHTDATA_USERNAME=
BRIGHTDATA_PASSWORD=
JWT_SECRET=
NEXT_PUBLIC_API_URL=
```
