# Frontend UniPass

## Ambiente local

1. Copie [`.env.local.example`](/d:/unipass/frontend/.env.local.example) para `frontend/.env.local`.
2. Ajuste `NEXT_PUBLIC_API_URL` para a URL do backend.
3. Instale as dependencias com `npm install`.
4. Rode `npm run dev`.

O frontend sobe em `http://localhost:3000` por padrao.

## Deploy

Defina esta variavel no provedor do frontend:

```bash
NEXT_PUBLIC_API_URL=https://seu-backend.com
```

O projeto usa `output: "standalone"` em [next.config.ts](/d:/unipass/frontend/next.config.ts), o que ajuda deploy via container.

## Importante para app/mobile

`localhost` dentro de um celular ou emulador nao aponta para o seu backend no computador.

Use a URL publica do backend ou o IP da sua maquina na rede local, por exemplo:

```bash
NEXT_PUBLIC_API_URL=http://192.168.0.25:4000
```
