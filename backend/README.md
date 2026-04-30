# Backend UniPass

## Ambiente local

1. Copie [`.env.example`](/d:/unipass/backend/.env.example) para `backend/.env`.
2. Ajuste `DATABASE_URL`, `JWT_SECRET` e, se precisar, as variaveis de SMS.
3. Suba a infraestrutura com `docker compose up -d postgres redis` na raiz do projeto.
4. Instale as dependencias com `npm install`.
5. Rode as migrations com `npx prisma migrate deploy`.
6. Se quiser dados iniciais, rode `npm run db:seed`.
7. Inicie a API com `npm run start:dev`.
8. Em outro terminal, inicie o worker com `npm run start:worker:dev`.

Por padrao a API sobe em `http://localhost:4000`.

## Variaveis importantes

- `FRONTEND_URLS`: lista separada por virgula com os dominios autorizados no CORS.
- `APP_TIMEZONE`: timezone oficial usada para calcular dia/horario das notificacoes.
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`: configuracao da fila BullMQ.
- `NOTIFICATION_WORKER_CONCURRENCY`: quantidade de jobs processados em paralelo pelo worker.
- `BILLING_WEBHOOK_WORKER_CONCURRENCY`: quantidade de webhooks financeiros processados em paralelo pelo worker.
- `BILLING_WEBHOOK_PENDING_AGE_SECONDS`: idade minima, em segundos, para o cron reprocessar webhooks pendentes.
- `BILLING_WEBHOOK_RETRY_BATCH_SIZE`: quantidade maxima de webhooks pendentes reprocessados por minuto.
- `ASAAS_WEBHOOK_TOKEN`: token legado do Asaas, se voce quiser manter uma checagem adicional por header.
- `ASAAS_WEBHOOK_IP_WHITELIST`: lista separada por virgula com IPs autorizados a chamar o webhook.
- `ASAAS_WEBHOOK_HMAC_SECRET`: segredo usado para validar a assinatura HMAC do payload bruto.
- `ASAAS_WEBHOOK_SIGNATURE_HEADER`: nome do header que carrega a assinatura HMAC. Padrao: `asaas-signature`.
- `ASAAS_WEBHOOK_HMAC_ALGORITHM`: algoritmo da assinatura HMAC. Padrao: `sha256`.
- `COOKIE_SECURE`: use `true` em producao com HTTPS.
- `COOKIE_SAME_SITE`: use `none` quando frontend e backend estiverem em dominios diferentes e com HTTPS.
- `COOKIE_DOMAIN`: defina apenas se voce realmente precisar compartilhar cookie entre subdominios.
- `DEVICE_API_KEY`: chave obrigatoria para endpoints de IoT e telemetria via header `x-api-key`.

## Deploy

Configure no provedor do backend pelo menos:

```bash
PORT=4000
HOST=0.0.0.0
DATABASE_URL=postgresql://...
JWT_SECRET=...
FRONTEND_URLS=https://seu-frontend.com
APP_TIMEZONE=America/Sao_Paulo
REDIS_HOST=redis
REDIS_PORT=6379
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
```

Se frontend e backend ficarem no mesmo dominio, voce pode manter `COOKIE_SAME_SITE=lax`.
