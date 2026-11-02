import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AssistantService } from "../services/assistant-service.js";

const roomParams = z.object({ roomId: z.string().min(1) });
const askBody = z.object({
  question: z.string().trim().min(1).max(500),
});

export async function assistantRoutes(
  app: FastifyInstance,
  service: AssistantService,
) {
  app.post("/api/rooms/:roomId/ask", async (request) => {
    const { roomId } = roomParams.parse(request.params);
    const { question } = askBody.parse(request.body);
    return { data: await service.ask(roomId, question) };
  });
}
