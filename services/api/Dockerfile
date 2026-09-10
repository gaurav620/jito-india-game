# =============================================================================
# JITO API — Dockerfile (multi-stage, non-root)
# =============================================================================
# Stage 1: builder   — install ALL deps, generate Prisma client, compile TS
# Stage 2: deps      — install PRODUCTION-ONLY deps for the runner
# Stage 3: runner    — minimal runtime image, non-root user, no dev deps
#
# Phase 2A review fix #15: added dedicated 'deps' stage that runs
# `npm ci --omit=dev` so the runner image contains only production
# node_modules, not the ~500MB of devDependencies from the build stage.
#
# Build context: repository root (so monorepo packages/* are accessible)
# docker build -f services/api/Dockerfile -t jito-api .
# =============================================================================

# ------ Stage 1: builder -----------------------------------------------
FROM node:20-alpine AS builder
LABEL stage="builder"

WORKDIR /app

# Copy workspace manifests for layer caching
COPY package.json package-lock.json ./
COPY packages/types/package.json          packages/types/package.json
COPY packages/shared/package.json         packages/shared/package.json
COPY packages/config/package.json         packages/config/package.json
COPY packages/ui/package.json             packages/ui/package.json
COPY packages/game-core/package.json      packages/game-core/package.json
COPY services/api/package.json            services/api/package.json

# Install ALL deps (including devDeps needed for build)
RUN npm ci --ignore-scripts

# Copy source
COPY packages/ packages/
COPY services/api/ services/api/

# Generate Prisma client (must run before tsc)
RUN npx prisma generate --schema=services/api/prisma/schema.prisma

# Build shared packages in dependency order
RUN npm run build -w packages/types
RUN npm run build -w packages/shared

# Build the API service
RUN npm run build -w services/api

# ------ Stage 2: production deps only -----------------------------------
# Fix #15: Separate stage installs ONLY production deps.
# This avoids shipping devDependencies (typescript, vitest, @nestjs/cli, etc.)
# to production — reduces image size significantly and shrinks attack surface.
FROM node:20-alpine AS prod-deps
LABEL stage="prod-deps"

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/types/package.json          packages/types/package.json
COPY packages/shared/package.json         packages/shared/package.json
COPY packages/config/package.json         packages/config/package.json
COPY packages/ui/package.json             packages/ui/package.json
COPY packages/game-core/package.json      packages/game-core/package.json
COPY services/api/package.json            services/api/package.json

# --omit=dev excludes all devDependencies; --ignore-scripts avoids postinstall
RUN npm ci --omit=dev --ignore-scripts

# ------ Stage 3: runner -------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Non-root user for security (CIS Docker Benchmark)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nestjs

# Copy only production node_modules (Fix #15: not the full builder node_modules)
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules           ./node_modules

# Copy compiled artifacts from builder
COPY --from=builder --chown=nestjs:nodejs /app/packages/types/dist    ./packages/types/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/dist   ./packages/shared/dist
COPY --from=builder --chown=nestjs:nodejs /app/services/api/dist      ./services/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/services/api/prisma    ./services/api/prisma

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/v1/health || exit 1

CMD ["node", "services/api/dist/main.js"]
