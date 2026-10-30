# SiteMemory

SiteMemory is an AI-powered spatial memory application for the Meta Global AI Developer Hackathon 2026. It is designed to record physical environments, track observations over time, and answer questions using visual evidence.

Milestone 1 provides a working TypeScript monorepo, persistent rooms, a Fastify API, and a polished React dashboard. Image scanning and live Meta inference are intentionally reserved for Milestone 2.

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

## API

| Method   | Endpoint         | Purpose        |
| -------- | ---------------- | -------------- |
| `GET`    | `/api/health`    | Service health |
| `GET`    | `/api/rooms`     | List rooms     |
| `POST`   | `/api/rooms`     | Create a room  |
| `GET`    | `/api/rooms/:id` | Get a room     |
| `DELETE` | `/api/rooms/:id` | Delete a room  |

Responses use `{ "data": ... }` on success and `{ "error": { "code", "message" } }` on failure.

## Meta integration status

SAM 3.1 is the critical Milestone 2 dependency. Current official public Meta material confirms the model and its text-prompted segmentation capabilities, but this repository does not guess authenticated API details. See [the access validation checklist](docs/meta-access-validation.md).

## Documentation

- [Full implementation plan](docs/implementation-plan.md)
- [Architecture](docs/architecture.md)
- [Meta access validation](docs/meta-access-validation.md)

## Privacy

Do not commit room photographs, API keys, `.env` files, or local databases. Images introduced in later milestones must be validated, stored outside source control, and clearly disclosed as AI-processed content.

## License

MIT
