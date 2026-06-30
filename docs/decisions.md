# Decisões e Aprendizados do Projeto

Esse arquivo é a memória do projeto. Toda vez que algo der errado, toda vez que uma decisão importante for tomada, ou toda vez que um agente aprender algo novo — registrar aqui. Esse arquivo é lido pelos agentes para não repetir erros.

---

## Como registrar

```
## [DATA] — [NOME DO AGENTE OU ÁREA]
- CONTEXTO: o que estava sendo feito
- PROBLEMA/DECISÃO: o que aconteceu ou qual decisão foi tomada
- SOLUÇÃO/RESULTADO: como foi resolvido
- REGRA NOVA: qual regra foi adicionada ao agente para não repetir
```

---

## Início do Projeto — Setup Inicial

- CONTEXTO: Início do desenvolvimento do Marketplace Copilot
- DECISÃO: Usar Next.js 14 App Router + Supabase + Railway como stack principal
- MOTIVO: Menor custo operacional no início, fácil de escalar, sem DevOps complexo
- REVISÃO: Reavaliar migração para AWS/GCP quando atingir 500 clientes pagantes

---

## Prioridade de Features — Decisão Estratégica

- CONTEXTO: Definição do roadmap inicial
- DECISÃO: Construir na ordem: análise de título → monitor de preço → resposta automática → dashboard de rentabilidade → diagnóstico de queda
- MOTIVO: Análise de título tem resultado visível em minutos (reduz churn nos primeiros 30 dias), monitor de preço tem uso diário (aumenta retenção), resposta automática economiza tempo real
- REGRA: Sempre priorizar features com resultado visível rápido para o usuário

---

*Registrar aqui toda decisão importante e todo erro encontrado durante o desenvolvimento.*
