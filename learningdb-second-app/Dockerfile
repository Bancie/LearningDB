# Debian-based Bun image (glibc): @tailwindcss/vite → lightningcss ships reliable prebuilds for linux/arm64-gnu.
# node:20-alpine (musl) often fails at build with: Cannot find module '../lightningcss.linux-arm64-musl.node'
FROM oven/bun:1.3 AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN bun install --frozen-lockfile

FROM oven/bun:1.3 AS production-dependencies-env
COPY ./package.json ./bun.lock /app/
WORKDIR /app
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3 AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
ARG VITE_API_BASE_URL=http://localhost:8000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN bun run build

# SSR production: react-router-serve relies on react-dom/server streaming APIs present in Node's builds.
# Bun's react-dom/server.bun.js does not expose renderToPipeableStream → container restart loop when using bun run start.
FROM node:22-bookworm-slim
COPY ./package.json /app/package.json
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
ENV NODE_ENV=production
CMD ["./node_modules/.bin/react-router-serve", "./build/server/index.js"]
