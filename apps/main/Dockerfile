# ===============================
# Stage 1: Dependencies
# ===============================
FROM node:20-alpine3.19 AS deps

WORKDIR /app

ARG NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_OPTIONS=${NODE_OPTIONS}

# Install global tools
RUN npm install -g npm@11.1.0 turbo

# Copy root configs
COPY package.json package-lock.json turbo.json ./

# Copy workspace package.json files
COPY apps/main/package.json ./apps/main/
COPY packages/ui/package.json ./packages/ui/
COPY packages/store/package.json ./packages/store/

# Install deps (includes devDeps for build)
RUN npm ci --prefer-offline --no-audit
RUN npm cache clean --force


# ===============================
# Stage 2: Builder
# ===============================
FROM node:20-alpine3.19 AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ARG NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_OPTIONS=${NODE_OPTIONS}

RUN npm install -g npm@11.1.0 turbo

# Copy deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/turbo.json ./

# Copy source
COPY apps ./apps
COPY packages ./packages

# -------------------------------
# Build-time public envs
# -------------------------------
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_API_BASE_URL_KEYCLOCK
ARG NEXT_PUBLIC_MASTER_URL
ARG NEXT_PUBLIC_WORKFLOW_URL
ARG NEXT_PUBLIC_REPORTS_URL
ARG NEXT_PUBLIC_DASHBOARD_URL
ARG NEXT_PUBLIC_LEAVE_URL
ARG NEXT_PUBLIC_MUSTER_URL
ARG NEXT_PUBLIC_WAGES_URL
ARG NEXT_PUBLIC_OTAPPLICATION_URL
ARG NEXT_PUBLIC_NEXTAUTH_URL
ARG NEXT_PUBLIC_BGM_URL
ARG NEXT_PUBLIC_AI_URL
ARG NEXT_PUBLIC_AIAPPLICATION_URL
ARG NEXT_PUBLIC_CHALLAN_URL
ARG NEXT_PUBLIC_ENCRYPTION_KEY
ARG NEXT_PUBLIC_REVERSEPROXY
ARG NEXT_PUBLIC_API_AI_URL

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_API_BASE_URL_KEYCLOCK=${NEXT_PUBLIC_API_BASE_URL_KEYCLOCK}
ENV NEXT_PUBLIC_MASTER_URL=${NEXT_PUBLIC_MASTER_URL}
ENV NEXT_PUBLIC_WORKFLOW_URL=${NEXT_PUBLIC_WORKFLOW_URL}
ENV NEXT_PUBLIC_REPORTS_URL=${NEXT_PUBLIC_REPORTS_URL}
ENV NEXT_PUBLIC_DASHBOARD_URL=${NEXT_PUBLIC_DASHBOARD_URL}
ENV NEXT_PUBLIC_LEAVE_URL=${NEXT_PUBLIC_LEAVE_URL}
ENV NEXT_PUBLIC_MUSTER_URL=${NEXT_PUBLIC_MUSTER_URL}
ENV NEXT_PUBLIC_WAGES_URL=${NEXT_PUBLIC_WAGES_URL}
ENV NEXT_PUBLIC_OTAPPLICATION_URL=${NEXT_PUBLIC_OTAPPLICATION_URL}
ENV NEXT_PUBLIC_NEXTAUTH_URL=${NEXT_PUBLIC_NEXTAUTH_URL}
ENV NEXT_PUBLIC_BGM_URL=${NEXT_PUBLIC_BGM_URL}
ENV NEXT_PUBLIC_AI_URL=${NEXT_PUBLIC_AI_URL}
ENV NEXT_PUBLIC_AIAPPLICATION_URL=${NEXT_PUBLIC_AIAPPLICATION_URL}
ENV NEXT_PUBLIC_CHALLAN_URL=${NEXT_PUBLIC_CHALLAN_URL}
ENV NEXT_PUBLIC_ENCRYPTION_KEY=${NEXT_PUBLIC_ENCRYPTION_KEY}
ENV NEXT_PUBLIC_AIAPPLICATION_URL=${NEXT_PUBLIC_AIAPPLICATION_URL}
ENV NEXT_PUBLIC_REVERSEPROXY=${NEXT_PUBLIC_REVERSEPROXY}
ENV NEXT_PUBLIC_API_AI_URL=${NEXT_PUBLIC_API_AI_URL}

# Build only main app
RUN turbo run build --filter=main...

RUN rm -rf /root/.npm/_logs /tmp/*


# ===============================
# Stage 3: Runner (Standalone)
# ===============================
FROM node:20-alpine3.19 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Runtime secrets only
ARG NEXTAUTH_SECRET
ARG NEXT_KEYCLOAK_CLIENT_SECRET
ARG NEXT_KEYCLOAK_CLIENT_ID
ARG NEXT_KEYCLOAK_ISSUER

ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXT_KEYCLOAK_CLIENT_SECRET=${NEXT_KEYCLOAK_CLIENT_SECRET}
ENV NEXT_KEYCLOAK_CLIENT_ID=${NEXT_KEYCLOAK_CLIENT_ID}
ENV NEXT_KEYCLOAK_ISSUER=${NEXT_KEYCLOAK_ISSUER}

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/apps/main/.next/standalone ./
COPY --from=builder /app/apps/main/.next/static ./apps/main/.next/static
COPY --from=builder /app/apps/main/public ./apps/main/public

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["node", "apps/main/server.js"]