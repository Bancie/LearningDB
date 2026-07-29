# LearningDB

## Run from Docker Hub

Prebuilt images are published under [`bancie`](https://hub.docker.com/u/bancie) (`learningdb-api`, `learningdb-orchestrator`, `learningdb-web`, `learningdb-web-second`).

```bash
cp .env.example .env   # set DB_PASS and API keys
docker compose -f compose.hub.yml up -d
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| Web (CRUD) | http://localhost:3001 |
| API | http://localhost:8000 |
| Orchestrator | http://localhost:8100 |
| MySQL | localhost:3308 |

To rebuild and push images (maintainers; requires `docker login` as `bancie`):

```bash
./scripts/docker-hub-push.sh
```

For local source builds, use `compose.yml` instead of `compose.hub.yml`.

## Second web app (CRUD)

The experimental CRUD-only UI lives in [`learningdb-second-app/`](learningdb-second-app/) (dev on **port 3001**, Docker Compose service `web-second` on **3001**). Local dev and installs use **Bun** — see that folder’s README for commands.

## Committing submodule changes

When the `learningdb` submodule has modified or untracked changes, commit them **inside the submodule first**, then update the parent repo.

### 1. Commit inside the submodule

```bash
cd learningdb
git add -A
git status                    # optional: review what's staged
git commit -m "Your message"
```

### 2. Commit the submodule update in the parent repo

```bash
cd ..   # or cd /path/to/LearningDB
git add learningdb
git commit -m "Update learningdb submodule: <short description>"
```

### One-liner (from parent repo root)

```bash
(cd learningdb && git add -A && git commit -m "Your submodule message") && git add learningdb && git commit -m "Update learningdb submodule"
```

Replace `learningdb` with your submodule path if different; adjust commit messages as needed.
