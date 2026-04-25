# bookworm-slim (glibc): @tailwindcss/vite → lightningcss ships reliable prebuilds for linux/arm64-gnu.
# node:20-alpine (musl) often fails at build with: Cannot find module '../lightningcss.linux-arm64-musl.node'
FROM node:20-bookworm-slim AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:20-bookworm-slim AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:20-bookworm-slim AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
ARG VITE_API_BASE_URL=http://localhost:8000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM node:20-bookworm-slim
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
CMD ["npm", "run", "start"]
