#!/usr/bin/env bash
# Build and push LearningDB images to Docker Hub (bancie/*).
# Requires: docker login as bancie (or an account that can push to bancie/*).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DOCKER_USER="${DOCKER_USER:-bancie}"
DATE_TAG="${DATE_TAG:-$(date +%Y%m%d)}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:8000/api}"
VITE_ORCH_API_BASE_URL="${VITE_ORCH_API_BASE_URL:-http://localhost:8100}"

IMAGES=(
  "learningdb-api"
  "learningdb-orchestrator"
  "learningdb-web"
  "learningdb-web-second"
)

if ! docker info >/dev/null 2>&1; then
  echo "error: Docker daemon is not reachable. Start Docker Desktop and retry." >&2
  exit 1
fi

echo "==> Building and tagging images as ${DOCKER_USER}/*:${DATE_TAG} and :latest"
echo "    (push requires: docker login — username ${DOCKER_USER})"
echo

# api
docker build \
  -t "${DOCKER_USER}/learningdb-api:latest" \
  -t "${DOCKER_USER}/learningdb-api:${DATE_TAG}" \
  -f learningdb/backend/Dockerfile \
  learningdb/backend

# orchestrator (context = repo root)
docker build \
  -t "${DOCKER_USER}/learningdb-orchestrator:latest" \
  -t "${DOCKER_USER}/learningdb-orchestrator:${DATE_TAG}" \
  -f learningdb/orchestrator/Dockerfile \
  .

# web
docker build \
  -t "${DOCKER_USER}/learningdb-web:latest" \
  -t "${DOCKER_USER}/learningdb-web:${DATE_TAG}" \
  --build-arg "VITE_API_BASE_URL=${VITE_API_BASE_URL}" \
  --build-arg "VITE_ORCH_API_BASE_URL=${VITE_ORCH_API_BASE_URL}" \
  -f learningdb/Dockerfile \
  learningdb

# web-second
docker build \
  -t "${DOCKER_USER}/learningdb-web-second:latest" \
  -t "${DOCKER_USER}/learningdb-web-second:${DATE_TAG}" \
  --build-arg "VITE_API_BASE_URL=${VITE_API_BASE_URL}" \
  -f learningdb-second-app/Dockerfile \
  learningdb-second-app

echo
echo "==> Smoke-check: personal/ must not appear in orchestrator image"
if docker run --rm "${DOCKER_USER}/learningdb-orchestrator:latest" \
  sh -c 'find / -name personal -type d 2>/dev/null | head -5' | grep -q .; then
  echo "error: found a 'personal' directory in orchestrator image; aborting push." >&2
  exit 1
fi
echo "    OK (no personal directories found)"

echo
echo "==> Pushing to Docker Hub"
for name in "${IMAGES[@]}"; do
  docker push "${DOCKER_USER}/${name}:latest"
  docker push "${DOCKER_USER}/${name}:${DATE_TAG}"
done

echo
echo "==> Done. End users can run:"
echo "    cp .env.example .env   # set DB_PASS and API keys"
echo "    docker compose -f compose.hub.yml up -d"
echo
echo "Images:"
for name in "${IMAGES[@]}"; do
  echo "  - ${DOCKER_USER}/${name}:latest"
  echo "  - ${DOCKER_USER}/${name}:${DATE_TAG}"
done
