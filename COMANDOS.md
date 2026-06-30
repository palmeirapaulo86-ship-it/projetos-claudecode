# Comandos para usar no Claude Code — Marketplace Copilot

Cole cada comando abaixo no terminal do Claude Code (VS Code) na ordem indicada.

---

## PASSO 1 — Inicialização (rodar uma vez)

Cole esse comando para o Claude Code ler tudo e confirmar que entendeu:

```
Leia o arquivo CLAUDE.md na raiz do projeto e todos os arquivos dentro de .claude/agents/. Depois me confirme: qual é o produto que estamos construindo, qual é a stack de tecnologia, quais são os 7 agentes disponíveis e qual é a ordem das features a construir. Seja direto e organizado na resposta.
```

---

## PASSO 2 — Criar a estrutura completa do projeto

Cole esse comando para criar todos os arquivos base:

```
Você é o time completo de desenvolvimento do Marketplace Copilot. Siga o CLAUDE.md e os agentes em .claude/agents/. 

Crie agora a estrutura completa do projeto com todos os arquivos necessários para começar:

1. Use o agente database para criar o schema Prisma completo conforme definido no agents/database.md
2. Use o agente backend para criar a estrutura de pastas e os arquivos base do servidor Express (index.ts, app.ts, middleware de auth, middleware de rate limiting, logger, conexão com banco e Redis)
3. Use o agente frontend para criar a estrutura do Next.js com layout base, página de login, página de dashboard vazia e componentes compartilhados essenciais
4. Crie o arquivo .env.example com todas as variáveis necessárias
5. Crie o package.json do backend e o package.json do frontend com todas as dependências corretas
6. Use o agente qa-reviewer para validar tudo antes de finalizar

Não pergunte confirmações — execute tudo e me mostre o que foi criado.
```

---

## PASSO 3 — Construir a Feature 1: Análise de Título

Cole esse comando para construir a primeira feature completa:

```
Construa a Feature 1 completa: Análise de Título de Anúncio com Score de IA.

Siga esse fluxo obrigatório:
1. Agente strategic-ceo: valide se essa feature deve ser construída agora e confirme a ordem de construção
2. Agente database: crie a migration para a tabela listing_analyses se ainda não existir
3. Agente backend: crie o endpoint POST /api/listings/:id/analyze/title que recebe o título, enfileira a análise e retorna o jobId
4. Agente ai-engine: crie o pipeline completo de análise de título usando Claude API — score 0-100, problemas encontrados, 3 sugestões de títulos alternativos, output em JSON validado por Zod
5. Agente frontend: crie a tela de análise de título com: campo para colar o título atual, botão de analisar, loading state com skeleton, card de resultado com score visual (círculo colorido 0-100), lista de problemas e lista de sugestões
6. Agente qa-reviewer: valide segurança, performance e qualidade de tudo

Entregue o código completo de cada parte. Não use dados mockados.
```

---

## PASSO 4 — Construir a Feature 2: Monitor de Preço

```
Construa a Feature 2 completa: Monitor de Preço de Concorrentes com Alertas em Tempo Real.

Fluxo obrigatório:
1. Agente strategic-ceo: valide a feature
2. Agente database: migration para tabelas competitors e price_history
3. Agente scraper: crie o scraper de preços do Mercado Livre com fila Bull, coleta a cada 30 minutos, armazena no Redis e consolida no PostgreSQL
4. Agente backend: endpoints para listar concorrentes por anúncio, histórico de preço, e configurar alertas
5. Agente frontend: dashboard de monitoramento com tabela de concorrentes, gráfico de histórico de preço (últimas 24h), badge indicando quem tem buy box, alerta visual quando preço próprio está acima da concorrência
6. Agente qa-reviewer: validar tudo

Código completo, sem mocks.
```

---

## PASSO 5 — Construir a Feature 3: Resposta Automática de Perguntas

```
Construa a Feature 3 completa: Resposta Automática de Perguntas com IA.

Fluxo obrigatório:
1. Agente strategic-ceo: valide
2. Agente database: migration para tabelas questions e auto_replies
3. Agente scraper: crie o coletor de perguntas novas do Mercado Livre (polling a cada 5 minutos)
4. Agente ai-engine: pipeline de classificação de pergunta + geração de resposta contextualizada usando título e descrição do produto, com flag de confiança e flag de revisão humana necessária
5. Agente backend: endpoints para listar perguntas, aprovar/editar resposta sugerida, configurar regras de auto-resposta, enviar resposta via API do ML
6. Agente frontend: inbox de perguntas com fila de pendentes, resposta sugerida pela IA com botão de aprovar ou editar, indicador de confiança da IA, histórico de perguntas respondidas
7. Agente qa-reviewer: validar tudo

Código completo, sem mocks.
```

---

## Como usar no dia a dia (qualquer feature nova)

```
Quero construir: [descreva a feature em português simples]

Siga o fluxo:
1. strategic-ceo valida
2. database cria o schema se necessário
3. backend cria a API
4. ai-engine cria o pipeline de IA se necessário
5. scraper cria a coleta se necessário
6. frontend cria a interface
7. qa-reviewer valida tudo antes do commit

Entregue código completo e funcional.
```

---

## Como corrigir erro (quando algo quebrar)

```
Encontrei esse erro: [cole o erro completo]

Arquivo com problema: [nome do arquivo]

O agente qa-reviewer deve analisar o erro, identificar a causa raiz e o agente correto deve corrigir. Depois qa-reviewer valida a correção antes de finalizar.
```

---

## Como o projeto fica "experiente" com o tempo

Sempre que algo der errado ou uma decisão importante for tomada, registre em docs/decisions.md usando o comando:

```
Registre no arquivo docs/decisions.md essa situação:
- O que aconteceu: [descreva]
- Como foi resolvido: [descreva]
- Qual regra deve ser adicionada para não repetir: [descreva]

Depois adicione a regra no arquivo .claude/agents/[agente-responsavel].md para que o agente não cometa o mesmo erro.
```
