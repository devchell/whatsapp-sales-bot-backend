# WhatsApp Sales Bot Backend

Backend modular em Node.js + TypeScript para atendimento, qualificacao de leads e vendas automatizadas via WhatsApp, com webhook compativel com Z-API, fluxo conversacional baseado em estados e persistencia em PostgreSQL via Prisma.

## Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma ORM
- Zod

## Arquitetura

- `controller`: recebe requests HTTP e traduz payloads externos
- `service`: executa regras de negocio e integracoes
- `repository/data access`: centralizado via Prisma client e servicos de estado
- `flow-engine`: state machine reutilizavel para conversas
- `intent-detector`: deteccao inicial de intencao pronta para evolucao com IA

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
      whatsapp.controller.ts
      whatsapp.service.ts
  routes/
    webhook.routes.ts
  utils/
    http-errors.ts
    logger.ts
    message.ts
    phone.ts
scripts/
  simulate-webhook.ts
```

## Como instalar

```bash
pnpm install
cp .env.example .env
```

## Variaveis de ambiente

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wpp_sales_bot?schema=public
ZAPI_BASE_URL=https://api.z-api.io
ZAPI_INSTANCE_ID=your-instance-id
ZAPI_INSTANCE_TOKEN=your-instance-token
ZAPI_CLIENT_TOKEN=your-client-token
DEFAULT_COUNTRY_CODE=55
WHATSAPP_SEND_ENABLED=false
```

## Banco de dados

1. Suba um PostgreSQL local ou remoto.
2. Configure `DATABASE_URL`.
3. Gere o Prisma Client:

```bash
pnpm prisma:generate
```

4. Aplique o schema:

```bash
pnpm prisma:push
```

Para ambiente real, prefira `pnpm prisma:migrate:dev` no desenvolvimento e migracoes versionadas no pipeline.

## Como rodar

```bash
pnpm dev
```

Healthcheck:

```bash
GET http://localhost:3000/health
```

Webhook:

```bash
POST http://localhost:3000/webhook/whatsapp
Content-Type: application/json

{
  "phone": "5511999999999",
  "text": "1"
}
```

## Fluxo do bot

Estados suportados:

- `START`
- `MENU`
- `LANDING_PAGE`
- `AUTOMACAO`
- `SISTEMA`
- `IA`
- `QUALIFICACAO`
- `FINAL`

Fluxo:

1. Identifica o usuario pelo telefone.
2. Busca ou cria o cliente.
3. Recupera a conversa e o estado atual.
4. Registra a mensagem recebida.
5. Resolve a intencao ou avanca a qualificacao.
6. Salva novo estado, mensagens e dados do lead.
7. Responde via servico de WhatsApp.

## Teste com ngrok

Exemplo:

```bash
ngrok http 3000
```

Depois configure a URL publica no provedor WhatsApp:

```text
https://SEU-ENDPOINT.ngrok-free.app/webhook/whatsapp
```

## Simular mensagens

Com servidor rodando:

```bash
pnpm test:webhook -- "1"
pnpm test:webhook -- "quero automacao"
pnpm test:webhook -- "atendo 40 clientes por dia"
```

## Seguranca aplicada

- Validacao de entrada com Zod
- Normalizacao de telefone e texto
- `helmet` para headers de seguranca
- Corpo de request limitado
- Sem log de payload sensivel completo
- Servico de envio desacoplado para mock e futura autenticacao mais restritiva

## Evolucoes recomendadas

- Autenticacao do webhook por assinatura
- Multi-tenant por empresa/conta
- RBAC para painel administrativo
- Filas para envio e retry
- IA para classificacao semantica e recomendacao comercial
- Observabilidade com OpenTelemetry
