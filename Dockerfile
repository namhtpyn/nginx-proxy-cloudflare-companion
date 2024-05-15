#BUILD FROM NODE 20
FROM node:22-slim as base
RUN corepack enable


FROM base AS pnpm-cache
COPY ./pnpm-lock.yaml .
RUN pnpm fetch

FROM pnpm-cache AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --prefer-offline
RUN pnpm build
RUN pnpm prune --prod


FROM base as app
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
CMD ["pnpm", "start:prod"]