# ─── Multi-stage build for Google Cloud Run ──────────────────────────────────
# Use debian-based image to fix Prisma OpenSSL issue (alpine is missing libssl)
FROM node:20-slim AS base

# Install OpenSSL + dumb-init for Prisma compatibility and graceful shutdown
RUN apt-get update -y && apt-get install -y openssl dumb-init && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ─── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps

COPY server/package*.json ./
RUN npm ci --omit=dev

# ─── Production image ─────────────────────────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy server source + prisma schema
COPY server/ ./server/
COPY server/package.json ./package.json

# Generate Prisma client (needs schema file, not DB connection)
RUN cd server && npx prisma generate

EXPOSE 8080

# Use dumb-init for proper signal forwarding (graceful shutdown on Cloud Run)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/api-gateway/src/index.js"]
