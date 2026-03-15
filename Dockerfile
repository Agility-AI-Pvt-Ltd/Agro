# ─── Multi-stage build for Google Cloud Run ──────────────────────────────────
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling in containers
RUN apk add --no-cache dumb-init

WORKDIR /app

# ─── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps

COPY server/package*.json ./
# Use npm ci for reproducible installs (uses package-lock.json)
RUN npm ci --omit=dev

# ─── Production image ─────────────────────────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy server source
COPY server/ ./server/

# Copy package.json for metadata
COPY server/package.json ./package.json

# Generate Prisma client
RUN cd server && npx prisma generate

# Cloud Run injects PORT env var; our server respects it
EXPOSE 3000

# Use dumb-init to forward signals properly (graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/api-gateway/src/index.js"]
