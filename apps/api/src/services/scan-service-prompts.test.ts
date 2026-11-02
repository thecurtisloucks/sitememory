import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { ImageStorage } from "./image-storage.js";
import { PrismaScanService } from "./scan-service.js";
import type { VisionProvider } from "./vision/index.js";

describe("PrismaScanService room prompts", () => {
  it("passes the room-specific tracking vocabulary to the vision provider", async () => {
    const scan = {
      id: "scan-1",
      roomId: "room-1",
      imagePath: "scan.jpg",
      mimeType: "image/jpeg",
      width: 100,
      height: 80,
      status: "PENDING",
    };
    const db = {
      scan: {
        findUnique: vi.fn().mockResolvedValue(scan),
        update: vi.fn().mockResolvedValue(scan),
      },
      room: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ objectPrompts: '["drill","safety glasses"]' }),
      },
    } as unknown as PrismaClient;
    const storage = {
      read: vi.fn().mockResolvedValue(Buffer.from("image")),
    } as unknown as ImageStorage;
    const segmentImage = vi
      .fn()
      .mockRejectedValue(new Error("stop after input"));
    const provider = {
      name: "mock" as const,
      segmentImage,
    } satisfies VisionProvider;
    const service = new PrismaScanService(db, storage, provider);

    await expect(service.process(scan.id)).rejects.toMatchObject({
      code: "PROCESSING_FAILED",
    });
    expect(segmentImage.mock.calls[0]?.[0].prompts).toEqual([
      "drill",
      "safety glasses",
    ]);
  });
});
