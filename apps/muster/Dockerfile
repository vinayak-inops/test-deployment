# ===============================
# Stage 1: Dependencies
# ===============================

FROM node:20.17.0-alpine3.19 AS deps

LABEL maintainer="vinayak@inops.tech"
LABEL description="INops muster Application"
LABEL version="1.0"

WORKDIR /app

ARG NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_OPTIONS=${NODE_OPTIONS}
ENV NEXT_TELEMETRY_DISABLED=1

# Copy root package files
COPY package.json package-lock.json ./
COPY turbo.json ./

# Copy workspace package.json files
COPY apps/muster/package.json ./apps/muster/
COPY packages/ui/package.json ./packages/ui/
COPY packages/store/package.json ./packages/store/

# Reproducible install based on package-lock.json
RUN npm ci --prefer-offline --no-audit


# ===============================
# Stage 2: Builder
# ===============================

FROM node:20.17.0-alpine3.19 AS builder
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

ARG NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_OPTIONS=${NODE_OPTIONS}

# Copy dependencies and project structure
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/turbo.json ./

# Copy application source
COPY apps/muster ./apps/muster
COPY packages ./packages

# ===============================
# Build-time NEXT_PUBLIC variables
# ===============================
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_NEXTAUTH_URL
ARG NEXT_PUBLIC_ENCRYPTION_KEY
ARG NEXT_PUBLIC_REVERSEPROXY
ARG NEXT_PUBLIC_API_AI_URL

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_NEXTAUTH_URL=${NEXT_PUBLIC_NEXTAUTH_URL}
ENV NEXT_PUBLIC_ENCRYPTION_KEY=${NEXT_PUBLIC_ENCRYPTION_KEY}
ENV NEXT_PUBLIC_REVERSEPROXY=${NEXT_PUBLIC_REVERSEPROXY}
ENV NEXT_PUBLIC_API_AI_URL=${NEXT_PUBLIC_API_AI_URL}

# Build muster app
RUN npx turbo run build --filter=muster...


# ===============================
# Stage 3: Runner
# ===============================

FROM node:20.17.0-alpine3.19 AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3006

# Runtime-only secrets
ARG NEXTAUTH_SECRET
ARG NEXT_KEYCLOAK_CLIENT_SECRET

ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXT_KEYCLOAK_CLIENT_SECRET=${NEXT_KEYCLOAK_CLIENT_SECRET}

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Copy production build from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/muster ./apps/muster
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages

USER nextjs

EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3006/muster/api/health || exit 1

CMD ["npm", "run", "start", "--prefix", "apps/muster"]
