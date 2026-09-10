# =============================================================================
# JITO Game Engine — Dockerfile (multi-stage, non-root)
# =============================================================================
# Stage 1: builder   — install ALL deps, generate Prisma client, compile TS
# Stage 2: prod-deps — install PRODUCTION-ONLY deps
# Stage 3: runner    — minimal runtime image, non-root user, no dev deps
#
# Phase 2A review fix #15: added dedicated 'prod-deps' stage so runner
# image does NOT ship devDependencies.
#
# Build context: repository root
# docker build -f services/game-engine/Dockerfile -t jito-game-engine .
# =============================================================================

# ------ Stage 1: builder -----------------------------------------------
FROM node:20-alpine AS builder
LABEL stage="builder"

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/types/package.json           packages/types/package.json
COPY packages/shared/package.json          packages/shared/package.json
COPY packages/config/package.json          packages/config/package.json
COPY packages/ui/package.json              packages/ui/package.json
COPY packages/game-core/package.json       packages/game-core/package.json
COPY services/game-engine/package.json     services/game-engine/package.json

RUN npm ci --ignore-scripts

COPY packages/ packages/
COPY services/game-engine/ services/game-engine/
# Game engine uses the API's Prisma schema
COPY services/api/prisma/ services/api/prisma/

RUN npx prisma generate --schema=services/api/prisma/schema.prisma

RUN npm run build -w packages/types
RUN npm run build -w packages/shared
RUN npm run build -w services/game-engine

# ------ Stage 2: production deps only -----------------------------------
# Fix #15: Separate stage installs ONLY production deps.
FROM node:20-alpine AS prod-deps
LABEL stage="prod-deps"

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/types/package.json           packages/types/package.json
COPY packages/shared/package.json          packages/shared/package.json
COPY packages/config/package.json          packages/config/package.json
COPY packages/ui/package.json              packages/ui/package.json
COPY packages/game-core/package.json       packages/game-core/package.json
COPY services/game-engine/package.json     services/game-engine/package.json

RUN npm ci --omit=dev --ignore-scripts

# ------ Stage 3: runner -------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nestjs

# Copy production-only node_modules (Fix #15)
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules               ./node_modules

# Copy compiled artifacts
COPY --from=builder --chown=nestjs:nodejs /app/packages/types/dist         ./packages/types/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/dist        ./packages/shared/dist
COPY --from=builder --chown=nestjs:nodejs /app/services/game-engine/dist   ./services/game-engine/dist

USER nestjs

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3003/api/v1/health || exit 1

CMD ["node", "services/game-engine/dist/main.js"]
