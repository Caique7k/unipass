# Frontend UniPass

## Ambiente local

1. Copie [`.env.local.example`](/d:/unipass/frontend/.env.local.example) para `frontend/.env.local`.
2. Ajuste `NEXT_PUBLIC_API_URL` para a URL do backend.
3. Instale as dependencias com `npm install`.
4. Rode `npm run dev`.

O frontend sobe em `http://localhost:3000` por padrao.

## Deploy com Docker

No fluxo com Compose, as variaveis publicas do frontend sao lidas da raiz do projeto porque o Next.js embute `NEXT_PUBLIC_*` no build da imagem.

1. Copie [`.env.example`](/d:/unipass/.env.example) para `.env` na raiz.
2. Ajuste `APP_DOMAIN`, `API_DOMAIN`, `CADDY_ACME_EMAIL`, `NEXT_PUBLIC_API_URL` e, se usar, os links de app mobile.
3. Garanta que o DNS dos dominios aponte para o servidor.
4. Rode `docker compose --profile proxy up -d --build`.

Variaveis importantes:

- `APP_DOMAIN`: dominio publico do frontend servido pelo Caddy.
- `API_DOMAIN`: dominio publico do backend servido pelo Caddy.
- `CADDY_ACME_EMAIL`: email usado no provisionamento do HTTPS automatico.
- `NEXT_PUBLIC_API_URL`: URL publica do backend consumida pelo navegador.
- `NEXT_PUBLIC_ANDROID_APP_URL`: link do APK ou pagina de download.
- `NEXT_PUBLIC_IOS_APP_URL`: link publico da App Store.
- `PROXY_HTTP_PORT` e `PROXY_HTTPS_PORT`: portas publicas do proxy reverso.
- `FRONTEND_HOST_BIND` e `FRONTEND_HOST_PORT`: acesso direto local ao container, que pode ficar em `127.0.0.1` em producao.

O projeto usa `output: "standalone"` em [next.config.ts](/d:/unipass/frontend/next.config.ts), o que facilita o deploy via container.

## Importante para app e mobile

`localhost` dentro de um celular ou emulador nao aponta para o backend no seu computador.

Use a URL publica do backend ou o IP da sua maquina na rede local, por exemplo:

```bash
NEXT_PUBLIC_API_URL=http://192.168.0.25:4000
```
