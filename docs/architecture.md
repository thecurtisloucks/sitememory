# Architecture

SiteMemory is a TypeScript-first npm workspaces monorepo. The React client communicates with a Fastify REST API. Prisma owns persistence in a local SQLite database for the hackathon prototype.

```text
React + TanStack Query -> Fastify routes -> services/repositories -> Prisma -> SQLite
                                      |-> private upload storage
                                      |-> VisionProvider -> Mock or Meta SAM 3.1
                                      |-> object matcher -> persistent identity/history
                                      |-> change classifier -> saved scan comparison
                                      |-> evidence retriever -> Muse reasoning provider
```

Shared request validation and transport types live in `packages/shared`. API route handlers depend on repository interfaces, which keeps integration tests deterministic and makes later persistence changes isolated.

## AI boundary

Milestone 2 introduces the explicit `VisionProvider` interface. `MockVisionProvider` provides deterministic local results; `MetaVisionProvider` uses the Meta Responses API and official `@meta-sam/parser`. Provider credentials remain server-side, and every scan persists its provider provenance so mock and live results are visibly distinguishable.

Images are sniffed from their bytes, limited to JPEG/PNG/WebP, capped at 10 MB by default, and saved under generated UUID filenames. Clients retrieve media by scan ID rather than supplying filesystem paths.

Each room persists its own validated tracking vocabulary. Scan processing reads those noun phrases immediately before inference, so the product is not limited to the four default demo categories. The list is capped at 12 short unique names to bound latency, cost, and prompt abuse.

## Spatial memory

Milestone 3 separates a detection (`ObjectObservation`) from the physical identity it may represent (`TrackedObject`). When a scan completes, a deterministic matcher scores same-label candidates using description overlap, normalized center distance, and relative area. It assigns each prior identity at most once per scan. High-confidence matches extend a history, clear non-matches create a new identity, and ambiguous matches remain uncertain and unattached.

The comparison service prefers confirmed tracked identities and uses a conservative label-and-geometry fallback for unmatched detections. It saves classifications and explanatory evidence while treating failed detection as “no longer visible,” never proof that an object left the room.

## Grounded assistant

Milestone 4 retrieves structured room evidence before any model request. Object questions select matching observation histories; general inventory questions select the latest observation per identity; change questions classify the two newest completed scans. The bounded context is sent through a `ReasoningProvider` implemented by deterministic mock and Meta Muse Spark providers.

The API, rather than the model, owns evidence references. It returns exact scan and observation IDs and uncertainty notes alongside the answer, so the UI can link every supporting claim back to a highlighted source image. Muse is instructed to use only supplied evidence and receives no API credentials in the browser.

## Production topology

The production container builds all workspaces, applies Prisma migrations at startup, and runs a single Fastify process. Fastify serves `/api`, protected uploaded media, immutable Vite assets, and the React SPA fallback. SQLite and uploads share a persistent `/data` volume. This single-instance topology is intentionally scoped to the hackathon prototype.
