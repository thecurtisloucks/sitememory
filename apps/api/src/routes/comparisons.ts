import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ComparisonService } from "../services/comparison/comparison-service.js";

const roomParams = z.object({ roomId: z.string().min(1) });
const comparisonParams = z.object({ comparisonId: z.string().min(1) });
const compareBody = z.object({
  sourceScanId: z.string().min(1),
  targetScanId: z.string().min(1),
});

export async function comparisonRoutes(
  app: FastifyInstance,
  service: ComparisonService,
) {
  app.post("/api/rooms/:roomId/compare", async (request, reply) => {
    const { roomId } = roomParams.parse(request.params);
    const input = compareBody.parse(request.body);
    const comparison = await service.compare(
      roomId,
      input.sourceScanId,
      input.targetScanId,
    );
    return reply.code(201).send({ data: comparison });
  });

  app.get("/api/comparisons/:comparisonId", async (request) => {
    const { comparisonId } = comparisonParams.parse(request.params);
    return { data: await service.get(comparisonId) };
  });
}
