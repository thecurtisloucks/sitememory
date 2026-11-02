import type { Scan } from "@sitememory/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import type { RoomRepository } from "../repositories/room-repository.js";
import type { CreateScanInput, ScanService } from "../services/scan-service.js";

const now = "2026-11-01T12:00:00.000Z";

function scan(status: Scan["status"] = "PENDING"): Scan {
  return {
    id: "scan-1",
    roomId: "room-1",
    imageUrl: "/api/scans/scan-1/image",
    originalFilename: "desk.png",
    mimeType: "image/png",
    byteSize: 4,
    width: 100,
    height: 80,
    capturedAt: now,
    createdAt: now,
    updatedAt: now,
    status,
    errorMessage: null,
    provider: "mock",
    observations: [],
  };
}

class MemoryScanService implements ScanService {
  created?: CreateScanInput;
  current = scan();

  async list() {
    return this.created ? [this.current] : [];
  }

  async get() {
    return this.current;
  }

  async create(input: CreateScanInput) {
    this.created = input;
    return this.current;
  }

  async process() {
    this.current = { ...this.current, status: "COMPLETED" };
    return this.current;
  }

  async image() {
    return { bytes: Buffer.from("image"), mimeType: "image/png" as const };
  }

  async deleteFilesForRoom() {}
}

const roomRepository: RoomRepository = {
  async list() {
    return [];
  },
  async findById() {
    return null;
  },
  async create() {
    throw new Error("not used");
  },
  async delete() {
    return false;
  },
};

function multipartImage() {
  const boundary = "sitememory-test-boundary";
  return {
    boundary,
    body: Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="desk.png"\r\nContent-Type: image/png\r\n\r\nPNG!\r\n--${boundary}--\r\n`,
    ),
  };
}

describe("scan routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let service: MemoryScanService;

  beforeEach(async () => {
    service = new MemoryScanService();
    app = await buildApp({ roomRepository, scanService: service });
  });

  afterEach(async () => {
    await app.close();
  });

  it("uploads and persists scan metadata", async () => {
    const form = multipartImage();
    const response = await app.inject({
      method: "POST",
      url: "/api/rooms/room-1/scans",
      headers: {
        "content-type": `multipart/form-data; boundary=${form.boundary}`,
      },
      payload: form.body,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().data.status).toBe("PENDING");
    expect(service.created?.originalFilename).toBe("desk.png");
    expect(service.created?.bytes.toString()).toBe("PNG!");
  });

  it("processes a scan and serves its image", async () => {
    const processed = await app.inject({
      method: "POST",
      url: "/api/scans/scan-1/process",
    });
    expect(processed.json().data.status).toBe("COMPLETED");

    const image = await app.inject({
      method: "GET",
      url: "/api/scans/scan-1/image",
    });
    expect(image.headers["content-type"]).toContain("image/png");
    expect(image.body).toBe("image");
  });
});
