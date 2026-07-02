# ============================================================
# SIMO Backend — Production Dockerfile (Railway / Docker)
# Multi-stage: build TypeScript -> jalankan hasil compile saja.
# ============================================================

# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (termasuk devDependencies untuk compile TS)
COPY package*.json ./
RUN npm ci

# Generate Prisma Client lalu compile TypeScript
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Hanya dependencies production
COPY package*.json ./
RUN npm ci --omit=dev

# Prisma Client hasil generate + schema + migrations (untuk migrate deploy)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

# Kode hasil compile
COPY --from=builder /app/dist ./dist

# Folder upload foto (catatan: filesystem container bersifat ephemeral;
# gunakan Railway Volume / S3 untuk penyimpanan permanen)
RUN mkdir -p uploads

EXPOSE 3000

# Jalankan migrasi database lalu start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
