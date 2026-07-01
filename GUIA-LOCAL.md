# 🚀 Guia: Rodando o Marketplace Copilot no seu PC (Windows)

Este guia é para quem **nunca programou**. É só seguir os passos **na ordem**, copiando e colando cada comando. Qualquer linha em caixa cinza (`assim`) é um comando para colar no terminal.

> ⏱️ Tempo estimado na primeira vez: 30 a 45 minutos (a maior parte é download).

---

## 📋 Visão geral (o que vamos fazer)

1. Instalar 3 programas: **Node.js**, **Docker Desktop** e o **VS Code** (você já tem o VS Code).
2. Ligar o **banco de dados** e o **Redis** (com o Docker, em 1 comando).
3. Preparar e ligar o **backend** (o "cérebro" que faz as contas).
4. Preparar e ligar o **frontend** (a tela que você vê no navegador).
5. Abrir no navegador.

O projeto tem **duas partes** que rodam ao mesmo tempo, cada uma no seu próprio terminal:
- `backend/` → o servidor (porta 3001)
- `frontend/` → o site (porta 3000)

---

## PARTE 1 — Instalar os programas necessários

Faça isso **uma vez só** no seu computador.

### 1.1 Node.js (obrigatório)
1. Acesse: https://nodejs.org
2. Baixe a versão **LTS** (o botão grande à esquerda).
3. Abra o instalador e clique **Next** em tudo, até **Finish**.

Para conferir que instalou, abra o **PowerShell** (menu Iniciar → digite "PowerShell" → Enter) e cole:
```
node --version
```
Se aparecer algo como `v20.x.x`, deu certo. ✅

### 1.2 Docker Desktop (para o banco de dados)
O banco de dados (PostgreSQL) e o Redis são difíceis de instalar no Windows na mão. O Docker resolve isso com **um comando só**.

1. Acesse: https://www.docker.com/products/docker-desktop
2. Baixe o **Docker Desktop for Windows** e instale (Next em tudo).
3. **Reinicie o computador** se ele pedir.
4. Abra o **Docker Desktop** pelo menu Iniciar e **deixe ele aberto** (ele fica um ícone de baleia perto do relógio). Espere ele dizer "Engine running".

> Se o Docker pedir para instalar o "WSL 2", aceite e siga o que a tela mandar. É normal.

### 1.3 VS Code
Você já tem. Vamos usá-lo para abrir o projeto e os terminais.

---

## PARTE 2 — Abrir o projeto no VS Code

1. Abra o **VS Code**.
2. Menu **File → Open Folder** (Arquivo → Abrir Pasta).
3. Escolha a pasta do projeto:
   `C:\Users\Kamos Devinath\Desktop\projetos claudecode`
4. Se aparecer "Do you trust the authors?", clique em **Yes, I trust**.

### Como abrir um terminal dentro do VS Code
- Menu **Terminal → New Terminal** (ou aperte `` Ctrl + ` ``).
- Um painel preto abre embaixo. É nele que você cola os comandos.
- Para abrir um **segundo** terminal (vamos precisar de dois), clique no ícone **+** no canto do painel de terminal.

---

## PARTE 3 — Ligar o banco de dados (Docker)

Com o **Docker Desktop aberto**, no terminal do VS Code (que já abre na pasta do projeto), cole:

```
docker compose up -d
```

Na primeira vez ele vai **baixar** o PostgreSQL e o Redis (pode demorar alguns minutos). Quando terminar, aparece algo com `Started`. ✅

Para conferir que os dois estão rodando:
```
docker compose ps
```
Você deve ver `copilot-postgres` e `copilot-redis` com status `running`/`Up`.

> 💡 O banco fica ligado em segundo plano. Você só precisa rodar esse comando de novo se reiniciar o PC.

---

## PARTE 4 — Configurar e ligar o BACKEND

### 4.1 Entrar na pasta do backend
No terminal, cole:
```
cd backend
```

### 4.2 Instalar as dependências
```
npm install
```
Isso baixa tudo que o backend precisa (demora 1-3 minutos). Pode aparecer alguns avisos amarelos — é normal.

### 4.3 Instalar o navegador do robô de preços (Playwright)
O monitor de preço usa um navegador automático. Instale-o com:
```
npx playwright install chromium
```

### 4.4 Criar o arquivo de configuração `.env`
O backend precisa de um arquivo com as "senhas e endereços". Vamos criá-lo:

1. No VS Code, clique com o **botão direito** na pasta `backend` (na lista de arquivos à esquerda) → **New File** (Novo Arquivo).
2. Dê o nome exatamente: `.env`  (com o ponto na frente)
3. **Cole o conteúdo abaixo** dentro dele e salve (`Ctrl + S`):

```
DATABASE_URL=postgresql://copilot:copilot123@localhost:5432/marketplace?schema=public
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=coloque-sua-chave-da-anthropic-aqui
SUPABASE_URL=http://localhost
SUPABASE_ANON_KEY=placeholder
SUPABASE_SERVICE_KEY=placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
JWT_SECRET=chave_secreta_local_para_desenvolvimento_1234567890
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

> 🔑 **Sobre a `ANTHROPIC_API_KEY`:** as funções de IA (análise de título, respostas, diagnósticos) só funcionam com uma chave real da Anthropic. Pegue a sua em https://console.anthropic.com → **API Keys**. Se deixar o texto placeholder, o resto do sistema liga normalmente, mas os botões de IA vão dar erro.
>
> Os valores `placeholder` de Supabase e Stripe estão aí só para o servidor iniciar — você não precisa deles agora.

### 4.5 Preparar o banco de dados (criar as tabelas)
Ainda dentro da pasta `backend`, rode os dois comandos:

```
npx prisma generate
```
```
npx prisma db push
```

O `db push` cria todas as tabelas no banco automaticamente. Se aparecer algo como **"Your database is now in sync with your Prisma schema"**, funcionou. ✅

### 4.6 Ligar o backend
```
npm run dev
```
Espere aparecer uma linha como **`Servidor rodando na porta 3001`**. ✅

> ⚠️ **Deixe este terminal aberto e rodando.** Se você fechar, o backend para. Para desligar depois, clique no terminal e aperte `Ctrl + C`.

---

## PARTE 5 — Configurar e ligar o FRONTEND

Agora o site. Precisamos de um **segundo terminal** (o primeiro está ocupado com o backend).

### 5.1 Abrir um novo terminal
No painel de terminal do VS Code, clique no **+** para abrir outro terminal.

### 5.2 Entrar na pasta do frontend
```
cd frontend
```

### 5.3 Instalar as dependências
```
npm install
```

### 5.4 Criar o arquivo de configuração `.env.local`
1. Botão direito na pasta `frontend` → **New File**.
2. Nome exato: `.env.local`
3. Cole isto dentro e salve:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 5.5 Ligar o frontend
```
npm run dev
```
Espere aparecer **`Local: http://localhost:3000`**. ✅

---

## PARTE 6 — Abrir no navegador 🎉

Abra o navegador (Chrome, Edge...) e acesse:

```
http://localhost:3000
```

A tela do **Marketplace Copilot** vai aparecer!

---

## ⚠️ Importante saber (estado atual do projeto)

O projeto ainda está em construção. Algumas coisas **ainda não funcionam de ponta a ponta**, e isso é esperado:

- **O login ainda não tem servidor pronto** (`/api/auth/login` é uma etapa futura). Você consegue ver as telas, mas o fluxo completo de login/dados reais depende dessa parte.
- As telas de features usam um anúncio de exemplo (`demo`) porque a **importação de anúncios do Mercado Livre** ainda não foi construída.
- As funções de IA só respondem com uma **chave real da Anthropic** no `.env`.

Ou seja: este guia serve para **rodar e ver o projeto funcionando localmente**. As integrações finais (login, sincronizar anúncios do ML) são os próximos passos de desenvolvimento, já anotados no `CLAUDE.md`.

---

## 🔁 Como ligar tudo de novo (nas próximas vezes)

Depois da primeira vez, é bem mais rápido. Com o VS Code aberto na pasta e o Docker Desktop ligado:

1. **Banco de dados** (1 terminal qualquer):
   ```
   docker compose up -d
   ```
2. **Backend** (terminal 1):
   ```
   cd backend
   npm run dev
   ```
3. **Frontend** (terminal 2):
   ```
   cd frontend
   npm run dev
   ```
4. Abrir `http://localhost:3000`.

Para **desligar**: aperte `Ctrl + C` em cada terminal, e rode `docker compose down` para parar o banco.

---

## 🆘 Deu erro? Soluções comuns

| Erro que aparece | O que fazer |
|---|---|
| `docker: command not found` ou `not recognized` | O Docker Desktop não está instalado ou não está aberto. Abra o Docker Desktop e espere "Engine running". |
| `Cannot connect to the Docker daemon` | O Docker Desktop está fechado. Abra ele. |
| `npm: command not found` | O Node.js não foi instalado. Volte à Parte 1.1 e feche/reabra o VS Code depois de instalar. |
| Backend fecha sozinho com `Variáveis de ambiente inválidas` | Falta algo no arquivo `backend/.env`. Confira se colou **tudo** do passo 4.4 e se o arquivo se chama exatamente `.env`. |
| `Can't reach database server at localhost:5432` | O banco não está ligado. Rode `docker compose up -d` na raiz do projeto. |
| A porta 3000 ou 3001 "já está em uso" | Você já tem o servidor rodando em outro terminal. Feche o terminal antigo (`Ctrl + C`). |
| Os botões de IA dão erro | Falta a `ANTHROPIC_API_KEY` real no `backend/.env`. Coloque sua chave e reinicie o backend (`Ctrl + C` e `npm run dev` de novo). |

> 💡 Toda vez que mudar o arquivo `.env`, você precisa **desligar** (`Ctrl + C`) e **religar** (`npm run dev`) o backend para ele ler os valores novos.
