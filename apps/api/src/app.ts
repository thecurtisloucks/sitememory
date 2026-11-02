import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { ZodError } from "zod";
import { env } from "./lib/env.js";
import { HttpError } from "./lib/errors.js";
import { prisma } from "./lib/prisma.js";
import { PrismaRoomRepository } from "./repositories/prisma-room-repository.js";
import type { RoomRepository } from "./repositories/room-repository.js";
import { roomRoutes } from "./routes/rooms.js";
import { scanRoutes } from "./routes/scans.js";
import { ImageStorage } from "./services/image-storage.js";
import {
  PrismaScanService,
  type ScanService,
} from "./services/scan-service.js";
import { createVisionProvider } from "./services/vision/index.js";

export interface BuildAppOptions {
  roomRepository?: RoomRepository;
  scanService?: ScanService;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({ logger: options.logger ?? false });
  const repository = options.roomRepository ?? new PrismaRoomRepository(prisma);
  const scanService =
    options.scanService ??
    (options.roomRepository
      ? undefined
      : new PrismaScanService(
          prisma,
          new ImageStorage(env.UPLOAD_DIR, env.MAX_UPLOAD_BYTES),
          createVisionProvider(),
        ));

  await app.register(cors, { origin: env.WEB_ORIGIN });
  await app.register(multipart, {
    limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1, fields: 2 },
  });

  app.get("/api/health", async () => ({ data: { status: "ok" } }));
  await roomRoutes(
    app,
    repository,
    scanService
      ? (roomId) => scanService.deleteFilesForRoom(roomId)
      : undefined,
  );
  if (scanService) await scanRoutes(app, scanService);

  app.setErrorHandler((error, _request, reply) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "FST_REQ_FILE_TOO_LARGE"
    ) {
      return reply.code(413).send({
        error: {
          code: "IMAGE_TOO_LARGE",
          message: `Images must be ${env.MAX_UPLOAD_BYTES} bytes or smaller.`,
        },
      });
    }

    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "The request was invalid",
          details: error.flatten(),
        },
      });
    }

    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
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
