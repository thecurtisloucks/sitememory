import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { HttpError } from "../lib/errors.js";
import { ImageStorage } from "./image-storage.js";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

describe("ImageStorage", () => {
  let temporaryDirectory: string | undefined;

  afterEach(async () => {
    if (temporaryDirectory)
      await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("sniffs, stores, and reads a valid image using a generated filename", async () => {
    temporaryDirectory = await mkdtemp(
      path.join(os.tmpdir(), "sitememory-images-"),
    );
    const storage = new ImageStorage(temporaryDirectory, 1024 * 1024);
    const image = await storage.validate(png);
    const filename = await storage.save(image);

    expect(image.mimeType).toBe("image/png");
    expect(image.width).toBe(1);
    expect(filename).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(await readFile(path.join(temporaryDirectory, filename))).toEqual(
      png,
    );
  });

  it("rejects content whose bytes are not a supported image", async () => {
    const storage = new ImageStorage(os.tmpdir(), 1024);
    await expect(
      storage.validate(Buffer.from("not an image")),
    ).rejects.toMatchObject({
      code: "UNSUPPORTED_IMAGE_TYPE",
      statusCode: 415,
    } satisfies Partial<HttpError>);
  });
});
