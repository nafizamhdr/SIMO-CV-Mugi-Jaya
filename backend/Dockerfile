# ============================================================
# SIMO Backend — Production Dockerfile (Railway / Docker)
# Multi-stage: build TypeScript -> jalankan hasil compile saja.
# ============================================================

# ---------- Stage 1: build ----------
# node:20-slim (Debian) dipakai karena Prisma bermasalah dengan OpenSSL di Alpine.
FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
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
FROM node:20-slim AS runner
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
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
# gunakan S3/objek storage untuk penyimpanan permanen)
RUN mkdir -p uploads

# Hugging Face Spaces menjalankan container sebagai user UID 1000 —
# pastikan seluruh /app dapat ditulis & HOME mengarah ke lokasi writable.
RUN chown -R 1000:1000 /app
ENV HOME=/tmp \
    NPM_CONFIG_CACHE=/tmp/.npm
USER 1000

EXPOSE 3000

# Jalankan migrasi database lalu start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
