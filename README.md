# WhatsApp Sales Bot Backend

Backend em Node.js + TypeScript para atendimento, qualificacao de leads e vendas automatizadas via WhatsApp, com Prisma, PostgreSQL, flow-engine stateful e integracao real com Evolution API.

## Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma ORM
- Zod
- Evolution API

## Arquitetura

- `controller`: recebe webhook e traduz payloads externos
- `service`: executa regras de negocio e integracoes
- `database`: Prisma Client e schema PostgreSQL
- `flow-engine`: motor conversacional baseado em estados
- `state-manager`: persistencia do estado por conversa
- `intent-detector`: classificacao inicial de interesse

## Estrutura

```text
src/
  app.ts
  server.ts
  config/
    env.ts
  database/
    prisma/
      client.ts
      schema.prisma
  modules/
    chatbot/
      chatbot.service.ts
      flow-engine.ts
      intent-detector.ts
      state-manager.ts
    client/
      client.service.ts
    lead/
      lead.service.ts
    whatsapp/
      evolution.service.ts
      whatsapp.controller.ts
  routes/
    webhook.routes.ts
  utils/
    http-errors.ts
    logger.ts
    message.ts
    phone.ts
```

## Variaveis de ambiente

Crie um `.env` com:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wpp_sales_bot?schema=public
EVOLUTION_API_URL=https://evolution-app.onrender.com
EVOLUTION_INSTANCE=your-instance-name
EVOLUTION_API_KEY=your-evolution-api-key
DEFAULT_COUNTRY_CODE=55
```

## Como rodar localmente

```bash
npm install
npm run prisma:push
npm run dev
```

O `postinstall` gera o Prisma Client automaticamente.

## Health Check

```http
GET /health
```

Resposta:

```text
ok
```

## Webhook do WhatsApp

Endpoint:

```http
POST /webhook/whatsapp
```

O backend aceita payload de entrada da Evolution API e processa:

1. extracao do telefone
2. extracao da mensagem recebida
3. chamada do `chatbot.service`
4. resolucao do flow-engine
5. envio da resposta pela Evolution API

## Evolution API

O envio de mensagem usa:

```http
POST /message/sendText/{instance}
```

Headers:

```text
apikey: YOUR_API_KEY
Content-Type: application/json
```

Payload enviado pelo backend:

```json
{
  "number": "5511999999999",
  "textMessage": {
    "text": "mensagem"
  }
}
```

## DEPLOY COMPLETO NO RENDER

### 1. Subir repositorio no GitHub

Envie a branch `main` para o GitHub.

### 2. Conectar ao Render

No painel do Render:

1. clique em `New +`
2. escolha `Web Service`
3. conecte o repositorio GitHub
4. selecione este projeto

### 3. Criar o Web Service do backend

Configure:

- Runtime: `Node`
- Build command: `npm install && npm run build`
- Start command: `npm run start`

### 4. Adicionar variaveis de ambiente

No serviço do backend, configure:

- `NODE_ENV=production`
- `PORT=10000`
- `DATABASE_URL=...`
- `EVOLUTION_API_URL=https://evolution-app.onrender.com`
- `EVOLUTION_INSTANCE=your-instance-name`
- `EVOLUTION_API_KEY=your-evolution-api-key`
- `DEFAULT_COUNTRY_CODE=55`

### 5. Prisma no Render

Depois do primeiro deploy, rode no Shell do Render ou em job manual:

```bash
npm run prisma:push
```

Neste projeto, a estrategia escolhida para simplificar o free tier e `prisma db push`.

## EVOLUTION API NO RENDER

Crie um segundo serviço no Render para a Evolution API:

1. clique em `New +`
2. escolha `Web Service`
3. selecione `Deploy an existing image from a registry`
4. informe a imagem Docker: `evolutionapi/evolution-api`

Configure as variaveis minimas:

- `PORT=8080`
- `AUTHENTICATION_API_KEY=yourkey`

Depois do deploy, voce tera uma URL publica, por exemplo:

```env
EVOLUTION_API_URL=https://evolution-app.onrender.com
```

## WEBHOOK

Na Evolution API, configure o webhook da instancia apontando para:

```text
https://seu-backend.onrender.com/webhook/whatsapp
```

Para eventos por instancia, habilite pelo menos:

- `MESSAGES_UPSERT`

## CONECTAR WHATSAPP

1. acesse a interface ou endpoints da Evolution API
2. gere o QR code da instancia
3. escaneie com o WhatsApp
4. confirme o status da conexao

## Integracao entre servicos

Exemplo de configuracao final:

```env
DATABASE_URL=postgresql://...
EVOLUTION_API_URL=https://evolution-app.onrender.com
EVOLUTION_INSTANCE=meu-bot
EVOLUTION_API_KEY=super-secret-key
PORT=10000
```

Fluxo em producao:

1. WhatsApp entrega a mensagem para a Evolution API
2. Evolution API envia webhook para o backend no Render
3. Backend processa a conversa com o flow-engine
4. Backend responde usando `EvolutionService`
5. Evolution API entrega a resposta ao usuario final

## Scripts

```json
{
  "build": "tsc",
  "start": "node dist/server.js",
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts"
}
```

## Observacoes operacionais

- O servidor usa `process.env.PORT || 3000`
- O Prisma Client e gerado em `postinstall`
- O backend nao depende de Docker local
- O flow-engine existente foi preservado
- A integracao antiga com mock foi removida

## Proximos endurecimentos recomendados

- validar assinatura/origem do webhook
- adicionar filas para retry de envio
- aplicar multi-tenant com isolamento real por conta
- adicionar observabilidade e alertas
