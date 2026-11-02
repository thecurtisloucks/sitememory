FROM node:22-bookworm-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY . .
RUN npm run db:generate && npm run build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=3001 \
    SERVE_WEB=true \
    WEB_DIST_DIR=/app/apps/web/dist \
    DATABASE_URL=file:/data/sitememory.db \
    UPLOAD_DIR=/data/uploads

COPY --from=build /app /app
RUN mkdir -p /data/uploads
EXPOSE 3001
VOLUME ["/data"]
CMD ["sh", "-c", "npm run db:deploy && npm run start -w @sitememory/api"]
