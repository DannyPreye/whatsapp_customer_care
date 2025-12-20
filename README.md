# WhatsApp Manager API

Production-ready Express + TypeScript API with MongoDB (Mongoose), Winston logging, Swagger docs, and core middlewares.

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Copy env and run MongoDB via Docker (optional)

```bash
cp .env.example .env
docker compose up -d
```

3. Start in development

```bash
npm run dev
```

4. Build and start in production

```bash
npm run build
npm start
```

## Scripts
- dev: ts-node-dev server with reload
- build: compile TypeScript to `dist`
- start: run compiled server
- lint: ESLint checks
- format: Prettier format
- test: Jest unit/integration tests

## Endpoints
- GET `/api/health/live` — liveness
- GET `/api/health/ready` — readiness (Mongo connection)
- POST `/api/auth/login` — returns mock JWT
- CRUD `/api/users` — basic create/list/get scaffolding
- Swagger UI: `/docs`

## Project Structure
- `src/config` — typed env config
- `src/db` — Mongoose connection helpers
- `src/logger` — Winston with rotation + request logging
- `src/middlewares` — security, validation, auth, error handling
- `src/routes` — route modules
- `src/controllers` & `src/services` & `src/models` — app layers
- `src/docs` — Swagger config

## Notes
- Uses `cross-env` for Windows-compatible scripts.
- Default Mongo URI: `mongodb://localhost:27017/whatsapp_manager`.
- Logs written to `./logs` with rotation.
