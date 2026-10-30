# Architecture

SiteMemory is a TypeScript-first npm workspaces monorepo. The React client communicates with a Fastify REST API. Prisma owns persistence in a local SQLite database for the hackathon prototype.

```text
React + TanStack Query -> Fastify routes -> repositories -> Prisma -> SQLite
```

Shared request validation and transport types live in `packages/shared`. API route handlers depend on repository interfaces, which keeps integration tests deterministic and makes later persistence changes isolated.

## AI boundary

Future milestones will add explicit `VisionProvider` and `ReasoningProvider` interfaces under the API. Provider credentials will remain server-side. Mock and live results must be visibly distinguishable and stored with provenance.
