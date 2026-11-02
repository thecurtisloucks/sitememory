# Architecture

SiteMemory is a TypeScript-first npm workspaces monorepo. The React client communicates with a Fastify REST API. Prisma owns persistence in a local SQLite database for the hackathon prototype.

```text
React + TanStack Query -> Fastify routes -> services/repositories -> Prisma -> SQLite
                                      |-> private upload storage
                                      |-> VisionProvider -> Mock or Meta SAM 3.1
```

Shared request validation and transport types live in `packages/shared`. API route handlers depend on repository interfaces, which keeps integration tests deterministic and makes later persistence changes isolated.

## AI boundary

Milestone 2 introduces the explicit `VisionProvider` interface. `MockVisionProvider` provides deterministic local results; `MetaVisionProvider` uses the Meta Responses API and official `@meta-sam/parser`. Provider credentials remain server-side, and every scan persists its provider provenance so mock and live results are visibly distinguishable.

Images are sniffed from their bytes, limited to JPEG/PNG/WebP, capped at 10 MB by default, and saved under generated UUID filenames. Clients retrieve media by scan ID rather than supplying filesystem paths.
