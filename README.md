# WhatsApp Manager API

Production-ready Express + TypeScript API with MongoDB (Mongoose), Winston logging, Swagger docs, Pinecone vector search, Cloudinary document ingestion, and a Gemini-powered WhatsApp sales agent.

## Quick Start

1) Install dependencies

```bash
npm install
```

2) Configure environment

- Copy `.env.example` to `.env` and fill values:
	- `MONGO_URI` (MongoDB)
	- `JWT_SECRET`, `JWT_REFRESH_SECRET`
	- `CLOUDINARY_*` (for remote file URLs)
	- `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`
	- `GOOGLE_API_KEY` (for Gemini + embeddings)
	- `WHATSAPP_*` (webhook verify token, business/phone IDs, token)

3) (Optional) Start Mongo locally with Docker

```bash
docker compose up -d
```

4) Start in development

```bash
npm run dev
```

5) Build and start in production

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
- POST `/api/v1/documents/upload` — upload documents by remote URL (Cloudinary, etc.)
- WhatsApp webhook: `/api/v1/webhook` (verify + inbound message handling)
- Swagger UI: `/docs`

## Project Structure
- `src/config` — typed env config
- `src/db` — Mongoose connection helpers
- `src/logger` — Winston with rotation + request logging
- `src/middlewares` — security, validation, auth, error handling
- `src/routes` — route modules
- `src/controllers` & `src/services` & `src/models` — app layers
- `src/services/documentProcessor.service.ts` — downloads remote files (HTTP/HTTPS) to temp before parsing (PDF, DOCX, CSV, Excel, images via OCR)
- `src/services/pinecone.service.ts` — embeddings + vector store (per-organization namespaces)
- `src/services/agents` — Gemini-backed WhatsApp sales agent and tools
- `src/docs` — Swagger config

## Notes
- Uses `cross-env` for Windows-compatible scripts.
- Default Mongo URI: `mongodb://localhost:27017/whatsapp_manager`.
- Logs written to `./logs` with rotation.
- Document upload expects a reachable URL (e.g., Cloudinary). Files are downloaded to a temp path, parsed, chunked, and indexed into Pinecone.
- Ensure your Pinecone index dimension matches the embedding model (`text-embedding-004` → 3072 dims). Recreate the index or switch model if they differ.
- WhatsApp webhook verification uses `WHATSAPP_VERIFY_TOKEN`; set it to match your Meta app settings.
