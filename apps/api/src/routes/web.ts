import fs from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance, FastifyReply } from "fastify";

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

async function sendFile(reply: FastifyReply, filename: string) {
  const bytes = await fs.readFile(filename);
  return reply
    .type(contentTypes[path.extname(filename)] ?? "application/octet-stream")
    .send(bytes);
}

export async function webRoutes(app: FastifyInstance, webDistDir: string) {
  const root = path.resolve(webDistDir);
  const indexPath = path.join(root, "index.html");

  app.get("/*", async (request, reply) => {
    if (request.url.startsWith("/api/") || request.url === "/api") {
      return reply.code(404).send({
        error: { code: "NOT_FOUND", message: "API route not found" },
      });
    }
    let relativePath: string;
    try {
      relativePath = decodeURIComponent(request.url.split("?", 1)[0] ?? "/")
        .replace(/^\/+/, "")
        .replace(/\\/g, "/");
    } catch {
      return reply.code(400).send("Invalid URL");
    }
    const requestedPath = path.resolve(root, relativePath);
    const insideRoot =
      requestedPath === root || requestedPath.startsWith(`${root}${path.sep}`);
    if (!insideRoot) return reply.code(404).send("Not found");

    if (relativePath && path.extname(relativePath)) {
      try {
        reply.header("Cache-Control", "public, max-age=31536000, immutable");
        return await sendFile(reply, requestedPath);
      } catch {
        return reply.code(404).send("Not found");
      }
    }
    reply.header("Cache-Control", "no-cache");
    return sendFile(reply, indexPath);
  });
}
