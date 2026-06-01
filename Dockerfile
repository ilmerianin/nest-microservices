FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG APP_NAME=producer
RUN npm run build:${APP_NAME}

FROM node:20-alpine AS runner

WORKDIR /app

ARG APP_NAME=producer
ENV APP_NAME=${APP_NAME}

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main.js"]
