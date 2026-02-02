FROM oven/bun:1.1.38-alpine AS base

WORKDIR /api

COPY package.json ./

RUN bun install

COPY . .

RUN bun run build

FROM oven/bun:1.1.38-alpine AS prod

WORKDIR /api

# Create the appuser BEFORE chown
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=base /api/dist ./dist
COPY --from=base /api/package.json ./package.json
COPY --from=base /api/node_modules ./node_modules
COPY --from=base /api/migrate.cjs ./migrate.cjs
COPY --from=base /api/migrations ./migrations



COPY --from=base /api/public ./public

COPY . .


# Cloud Run requires this
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Cloud Run runs as non-root by default (bun image already handles this)

# Run migrations + start server
CMD ["sh", "-c", "bun run migrate && bun run start"]
