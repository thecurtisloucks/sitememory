import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { HttpError } from "../lib/errors.js";
import type { ScanService } from "../services/scan-service.js";

const roomParamsSchema = z.object({ roomId: z.string().min(1) });
const scanParamsSchema = z.object({ scanId: z.string().min(1) });

export async function scanRoutes(app: FastifyInstance, service: ScanService) {
  app.get("/api/rooms/:roomId/scans", async (request) => {
    const { roomId } = roomParamsSchema.parse(request.params);
    return { data: await service.list(roomId) };
  });

  app.post("/api/rooms/:roomId/scans", async (request, reply) => {
    const { roomId } = roomParamsSchema.parse(request.params);
    const part = await request.file();
    if (!part)
      throw new HttpError(400, "IMAGE_REQUIRED", "An image file is required.");
    const bytes = await part.toBuffer();
    if (part.file.truncated) {
      throw new HttpError(
        413,
        "IMAGE_TOO_LARGE",
        "The uploaded image is too large.",
      );
    }
    const scan = await service.create({
      roomId,
      bytes,
      originalFilename: part.filename,
    });
    return reply.code(201).send({ data: scan });
  });

  app.get("/api/scans/:scanId", async (request) => {
    const { scanId } = scanParamsSchema.parse(request.params);
    return { data: await service.get(scanId) };
  });

  app.get("/api/scans/:scanId/image", async (request, reply) => {
    const { scanId } = scanParamsSchema.parse(request.params);
    const image = await service.image(scanId);
    return reply
      .header("Cache-Control", "private, max-age=3600")
      .type(image.mimeType)
      .send(image.bytes);
  });

  app.post("/api/scans/:scanId/process", async (request) => {
    const { scanId } = scanParamsSchema.parse(request.params);
    return { data: await service.process(scanId) };
  });
}
