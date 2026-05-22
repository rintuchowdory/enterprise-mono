FROM node:22-alpine AS base
RUN npm i -g pnpm turbo
WORKDIR /app

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run --filter=@repo/web... build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
