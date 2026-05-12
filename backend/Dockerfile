FROM node:20-bookworm-slim AS base

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package*.json ./
RUN npm ci

FROM deps AS builder

ARG PRISMA_GENERATE_DATABASE_URL

COPY . .
RUN test -n "$PRISMA_GENERATE_DATABASE_URL"
RUN DATABASE_URL="$PRISMA_GENERATE_DATABASE_URL" npx prisma generate
RUN npm run build

FROM base AS runner

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev \
  && npm cache clean --force

COPY --chown=node:node prisma ./prisma
COPY --from=builder --chown=node:node /app/dist ./dist

ARG PRISMA_GENERATE_DATABASE_URL
RUN test -n "$PRISMA_GENERATE_DATABASE_URL"
RUN DATABASE_URL="$PRISMA_GENERATE_DATABASE_URL" npx prisma generate

USER node

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
