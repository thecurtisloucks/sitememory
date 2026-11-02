import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { webRoutes } from "./web.js";

describe("production web routes", () => {
  let directory: string;
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), "sitememory-web-"));
    await fs.mkdir(path.join(directory, "assets"));
    await fs.writeFile(
      path.join(directory, "index.html"),
      "<h1>SiteMemory</h1>",
    );
    await fs.writeFile(path.join(directory, "assets", "app.js"), "export {};");
    app = Fastify();
    await webRoutes(app, directory);
  });

  afterEach(async () => {
    await app.close();
    await fs.rm(directory, { recursive: true, force: true });
  });

  it("serves assets and falls back to the SPA entry point", async () => {
    const asset = await app.inject({ url: "/assets/app.js" });
    expect(asset.statusCode).toBe(200);
    expect(asset.headers["content-type"]).toContain("text/javascript");

    const route = await app.inject({ url: "/rooms/room-1" });
    expect(route.statusCode).toBe(200);
    expect(route.body).toContain("SiteMemory");
  });

  it("does not turn unknown API or asset routes into the SPA", async () => {
    expect((await app.inject({ url: "/api/missing" })).statusCode).toBe(404);
    expect((await app.inject({ url: "/assets/missing.js" })).statusCode).toBe(
      404,
    );
  });
});
