import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";
import { PrismaRoomRepository } from "./repositories/prisma-room-repository.js";
import type { RoomRepository } from "./repositories/room-repository.js";
import { roomRoutes } from "./routes/rooms.js";

export interface BuildAppOptions {
  roomRepository?: RoomRepository;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({ logger: options.logger ?? false });
  const repository = options.roomRepository ?? new PrismaRoomRepository(prisma);

  await app.register(cors, { origin: env.WEB_ORIGIN });

  app.get("/api/health", async () => ({ data: { status: "ok" } }));
  await roomRoutes(app, repository);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "The request was invalid",
          details: error.flatten(),
        },
      });
    }

    app.log.error(error);
    return reply.code(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  });

  return app;
}
