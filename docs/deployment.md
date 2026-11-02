# Deployment

SiteMemory ships as one production container: Fastify serves the API, uploaded images, and the built React single-page application. SQLite and uploads live on a persistent `/data` volume.

## Local production check

```bash
docker compose up --build
```

Open `http://localhost:3001`. Compose uses mock providers unless `VISION_PROVIDER`, `REASONING_PROVIDER`, and `META_API_KEY` are supplied in the local ignored `.env`.

## Hosting requirements

Use a container host that supports a persistent disk, such as Railway, Render, Fly.io, or a VM. Configure:

- Container port: `3001`
- Health check: `GET /api/health`
- Persistent mount: `/data`
- `API_HOST=0.0.0.0`
- `SERVE_WEB=true`
- `DATABASE_URL=file:/data/sitememory.db`
- `UPLOAD_DIR=/data/uploads`
- `WEB_ORIGIN` set to the deployed HTTPS origin
- `VISION_PROVIDER=meta` and `REASONING_PROVIDER=meta` for the live demo
- `META_API_KEY` as a secret

The container applies committed Prisma migrations before starting. Back up the `/data` volume before destructive infrastructure changes. SQLite is appropriate for this single-instance hackathon deployment; do not run multiple replicas against the same database file.

Never bake `.env`, credentials, private photographs, or a local database into the image. The Docker ignore rules exclude them.
