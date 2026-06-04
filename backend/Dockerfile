FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

# Tylko na czas budowania obrazu.
# Prawdziwy DATABASE_URL przyjdzie później z docker-compose.
ENV DATABASE_URL="postgresql://workflow:workflow_password@postgres:5432/workflow"

RUN npm ci
RUN npx prisma generate


FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 2000

CMD ["npm", "run", "start:prod"]