FROM node:lts-bookworm-slim AS base

# ----------------------------
# Stage 1: Install all dependencies
# ----------------------------
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ----------------------------
# Stage 2: Build the application
# ----------------------------
FROM deps AS build
WORKDIR /app
COPY . .
RUN node ace build

# ----------------------------
# Stage 3: Production runtime
# ----------------------------
FROM base AS production
WORKDIR /app

ARG TZ
ARG PORT
ARG HOST
ARG NODE_ENV

# App
ARG LOG_LEVEL
ARG APP_KEY
ARG APP_URL

# Session
ARG SESSION_DRIVER

# Node
ENV TZ=${TZ}
ENV PORT=${PORT}
ENV HOST=${HOST}
ENV NODE_ENV=${NODE_ENV}

# App
ENV LOG_LEVEL=${LOG_LEVEL}
ENV APP_KEY=${APP_KEY}
ENV APP_URL=${APP_URL}

# Session
ENV SESSION_DRIVER=${SESSION_DRIVER}

COPY --from=build /app/build ./
RUN npm ci --omit=dev

EXPOSE 3333
CMD ["sh", "-c", "node ace migration:run --connection=pg_direct --force && node bin/server.js"]
