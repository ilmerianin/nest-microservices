FROM node:20-alpine AS builder

WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./

RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm ci --include=dev

COPY . .

ARG APP_NAME=producer
RUN ./node_modules/.bin/nest build "${APP_NAME}" && npm prune --omit=dev

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache curl

ARG APP_NAME=producer
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

EXPOSE 3000

CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main.js"]
