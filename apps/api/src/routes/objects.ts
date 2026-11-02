import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ObjectMemoryService } from "../services/memory/object-memory-service.js";

const roomParams = z.object({ roomId: z.string().min(1) });
const objectParams = z.object({ objectId: z.string().min(1) });

export async function objectRoutes(
  app: FastifyInstance,
  service: ObjectMemoryService,
) {
  app.get("/api/rooms/:roomId/objects", async (request) => {
    const { roomId } = roomParams.parse(request.params);
    return { data: await service.list(roomId) };
  });

  app.get("/api/objects/:objectId/history", async (request) => {
    const { objectId } = objectParams.parse(request.params);
    return { data: await service.history(objectId) };
  });
}
