FROM node:20-bookworm-slim AS base

WORKDIR /app

ARG DATABASE_URL=postgresql://unipass:unipass123@localhost:5432/unipass_db
ENV DATABASE_URL=$DATABASE_URL

RUN apt-get update -y \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package*.json ./
RUN npm ci

FROM deps AS builder

COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY --from=builder /app/dist ./dist

RUN npx prisma generate

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
