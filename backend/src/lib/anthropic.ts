import Anthropic from '@anthropic-ai/sdk'

// Cliente único da Claude API. A chave vem só de variável de ambiente (validada em env.ts).
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Modelo obrigatório do projeto (ver CLAUDE.md e agents/ai-engine.md): sempre claude-sonnet-4-6.
export const CLAUDE_MODEL = 'claude-sonnet-4-6'
