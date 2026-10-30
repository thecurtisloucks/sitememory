import { createRoomSchema } from "@sitememory/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type {
  RoomRepository,
  StoredRoom,
} from "../repositories/room-repository.js";

const idParamsSchema = z.object({ id: z.string().min(1) });

function serializeRoom(room: StoredRoom) {
  return {
    ...room,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}

export async function roomRoutes(
  app: FastifyInstance,
  repository: RoomRepository,
) {
  app.get("/api/rooms", async () => ({
    data: (await repository.list()).map(serializeRoom),
  }));

  app.post("/api/rooms", async (request, reply) => {
    const input = createRoomSchema.parse(request.body);
    const room = await repository.create(input);
    return reply.code(201).send({ data: serializeRoom(room) });
  });

  app.get("/api/rooms/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const room = await repository.findById(id);

    if (!room) {
      return reply.code(404).send({
        error: { code: "ROOM_NOT_FOUND", message: "Room not found" },
      });
    }

    return { data: serializeRoom(room) };
  });

  app.delete("/api/rooms/:id", async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const deleted = await repository.delete(id);

    if (!deleted) {
      return reply.code(404).send({
        error: { code: "ROOM_NOT_FOUND", message: "Room not found" },
      });
    }

    return reply.code(204).send();
  });
}
