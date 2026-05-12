# Backend UniPass

## Ambiente local

1. Copie [`.env.example`](/d:/unipass/backend/.env.example) para `backend/.env`.
2. Ajuste `DATABASE_URL`, `JWT_SECRET`, `DEVICE_API_KEY` e, se precisar, as variaveis de SMS.
3. Se tambem for usar Docker Compose, copie [`.env.example`](/d:/unipass/.env.example) para `.env` na raiz.
4. Suba a infraestrutura com `docker compose up -d postgres redis` na raiz do projeto.
5. Instale as dependencias com `npm install`.
6. Rode as migrations com `npx prisma migrate deploy`.
7. Se quiser dados iniciais, rode `npm run db:seed`.
8. Inicie a API com `npm run start:dev`.
9. Em outro terminal, inicie o worker com `npm run start:worker:dev`.

Por padrao a API sobe em `http://localhost:4000`.

## Variaveis importantes

- `DATABASE_URL`: conexao usada pelo backend fora do Docker, normalmente apontando para `localhost`.
- `FRONTEND_URLS`: lista separada por virgula com os dominios autorizados no CORS.
- `APP_TIMEZONE`: timezone oficial usada para calcular dia e horario das notificacoes.
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`: configuracao da fila BullMQ.
- `NOTIFICATION_WORKER_CONCURRENCY`: quantidade de jobs processados em paralelo pelo worker.
- `BILLING_WEBHOOK_WORKER_CONCURRENCY`: quantidade de webhooks financeiros processados em paralelo pelo worker.
- `BILLING_WEBHOOK_PENDING_AGE_SECONDS`: idade minima, em segundos, para o cron reprocessar webhooks pendentes.
- `BILLING_WEBHOOK_RETRY_BATCH_SIZE`: quantidade maxima de webhooks pendentes reprocessados por minuto.
- `EXPO_PUSH_API_URL`: endpoint do provider Expo Push. Padrao: `https://exp.host/--/api/v2/push/send`.
- `EXPO_PUSH_ACCESS_TOKEN`: token opcional para Expo Push Security.
- `ASAAS_WEBHOOK_TOKEN`: token legado do Asaas para checagem adicional por header.
- `ASAAS_WEBHOOK_IP_WHITELIST`: lista separada por virgula com IPs autorizados a chamar o webhook.
- `ASAAS_WEBHOOK_HMAC_SECRET`: segredo usado para validar a assinatura HMAC do payload bruto.
- `ASAAS_WEBHOOK_SIGNATURE_HEADER`: nome do header que carrega a assinatura HMAC. Padrao: `asaas-signature`.
- `ASAAS_WEBHOOK_HMAC_ALGORITHM`: algoritmo da assinatura HMAC. Padrao: `sha256`.
- `COOKIE_SECURE`: use `true` em producao com HTTPS.
- `COOKIE_SAME_SITE`: use `none` quando frontend e backend estiverem em dominios diferentes e com HTTPS.
- `COOKIE_DOMAIN`: defina apenas se voce realmente precisar compartilhar cookie entre subdominios.
- `DEVICE_API_KEY`: chave obrigatoria para endpoints de IoT e telemetria via header `x-api-key`.

## Deploy com Docker

1. Copie [`.env.example`](/d:/unipass/.env.example) para `.env` na raiz.
2. Copie [`.env.example`](/d:/unipass/backend/.env.example) para `backend/.env`.
3. Ajuste as senhas, dominios publicos, `JWT_SECRET`, `DEVICE_API_KEY` e `FRONTEND_URLS`.
4. No `backend/.env`, configure `TRUST_PROXY=1`, `COOKIE_SECURE=true` e `COOKIE_SAME_SITE=none` quando estiver usando o proxy HTTPS.
5. Aponte o DNS de `APP_DOMAIN` e `API_DOMAIN` para o servidor.
6. Suba o stack com `docker compose --profile proxy up -d --build`.

Pontos importantes para producao:

- `DATABASE_URL_DOCKER` na raiz deve apontar para `postgres` como host interno do Compose.
- `POSTGRES_HOST_BIND` e `REDIS_HOST_BIND` ficam em `127.0.0.1` por seguranca.
- `BACKEND_HOST_BIND` e `FRONTEND_HOST_BIND` podem continuar em `127.0.0.1`, porque o acesso publico passa pelo Caddy em `80/443`.
- `COOKIE_SECURE=true` e `COOKIE_SAME_SITE=none` sao a combinacao esperada quando frontend e backend estiverem em dominios diferentes com HTTPS.
- `TRUST_PROXY=1` garante IP real e rate limit correto atras do reverse proxy.
- `COMPOSE_PROFILES=proxy` na raiz tambem ativa o proxy sem precisar passar `--profile proxy` em todo comando.

## Push notifications

O backend expoe endpoints autenticados para o app mobile registrar subscriptions push por usuario:

- `GET /push-notifications/subscriptions`
- `POST /push-notifications/subscriptions`
- `POST /push-notifications/subscriptions/deactivate`

Quando um `NotificationPrompt` entra em dispatch, o worker tenta enviar push primeiro para subscriptions ativas e, se nao houver provider ou token utilizavel, mantem o fallback atual via prompt pendente `IN_APP`.
