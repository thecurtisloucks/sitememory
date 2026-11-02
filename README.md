# SiteMemory

SiteMemory is an AI-powered spatial memory application for the Meta Global AI Developer Hackathon 2026. It is designed to record physical environments, track observations over time, and answer questions using visual evidence.

Milestone 4 adds an evidence-grounded room assistant powered by Meta Muse Spark. Questions are answered from retrieved observations and recent scan changes, with clickable visual evidence and explicit uncertainty instead of unsupported guesses.

## Stack

- React, Vite, Tailwind CSS, TanStack Query, React Router
- Fastify, Zod, Prisma, SQLite
- npm workspaces, TypeScript, Vitest

## Quick start

Requirements: a supported even-numbered Node.js release (Node 22 LTS is recommended) and npm 10 or newer. With nvm, run `nvm use` from the repository root.

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate -- --name init
npm run dev
```

Open http://localhost:5173. The API runs at http://127.0.0.1:3001 and exposes `GET /api/health`.

The default `DATABASE_URL` creates `prisma/dev.db`. Rooms persist between restarts. Local databases and environment files are ignored by Git.

## Commands

```bash
npm run dev          # web and API development servers
npm run build        # production builds for every workspace
npm run typecheck    # TypeScript checks
npm test             # unit and API integration tests
npm run format:check # formatting verification
npm run db:studio    # inspect the SQLite database
```

## Vision providers

Mock inference is the safe default and is always labeled as mock data in the UI:

```dotenv
VISION_PROVIDER="mock"
```

For real SAM 3.1 inference, create a Meta Model API credential and set backend-only values in `.env`:

```dotenv
VISION_PROVIDER="meta"
REASONING_PROVIDER="meta"
META_API_KEY="your-key"
META_API_BASE_URL="https://api.meta.ai/v1"
META_SAM_MODEL="sam-3.1"
META_MUSE_MODEL="muse-spark-1.3"
```

Restart the API after changing provider configuration. The key is never sent to the browser. Live inference sends the four core demo noun phrases—headphones, coffee mug, notebook, and keyboard—through the Meta Responses API and stores normalized boxes, decoded SVG masks, optional model confidence, diagnostics, and raw SAM output.

## API

| Method   | Endpoint                         | Purpose                           |
| -------- | -------------------------------- | --------------------------------- |
| `GET`    | `/api/health`                    | Service health                    |
| `GET`    | `/api/rooms`                     | List rooms                        |
| `POST`   | `/api/rooms`                     | Create a room                     |
| `GET`    | `/api/rooms/:id`                 | Get a room                        |
| `DELETE` | `/api/rooms/:id`                 | Delete a room                     |
| `GET`    | `/api/rooms/:roomId/scans`       | List room scans                   |
| `POST`   | `/api/rooms/:roomId/scans`       | Upload an image                   |
| `GET`    | `/api/scans/:scanId`             | Get a scan and observations       |
| `GET`    | `/api/scans/:scanId/image`       | Read the stored image             |
| `POST`   | `/api/scans/:scanId/process`     | Process or retry a scan           |
| `GET`    | `/api/rooms/:roomId/objects`     | List persistent objects           |
| `GET`    | `/api/objects/:objectId/history` | Read object evidence history      |
| `POST`   | `/api/rooms/:roomId/compare`     | Compare two completed scans       |
| `GET`    | `/api/comparisons/:comparisonId` | Read a saved comparison           |
| `POST`   | `/api/rooms/:roomId/ask`         | Ask an evidence-grounded question |

Responses use `{ "data": ... }` on success and `{ "error": { "code", "message" } }` on failure.

## Meta integration status

The live providers follow Meta's official Responses API contracts. On November 2, 2026, the configured developer credential successfully exercised both SAM 3.1 segmentation and Muse Spark 1.3 grounded reasoning. See [the access validation record](docs/meta-access-validation.md).

## Documentation

- [Full implementation plan](docs/implementation-plan.md)
- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Meta access validation](docs/meta-access-validation.md)

## Privacy

Do not commit room photographs, API keys, `.env` files, or local databases. Uploaded images are byte-validated, stored under `uploads/` outside source control, and clearly disclosed as AI-processed content.

## License

MIT
