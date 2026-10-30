import type { PrismaClient } from "@prisma/client";
import type { CreateRoomInput } from "@sitememory/shared";
import type { RoomRepository } from "./room-repository.js";

export class PrismaRoomRepository implements RoomRepository {
  constructor(private readonly db: PrismaClient) {}

  list() {
    return this.db.room.findMany({ orderBy: { updatedAt: "desc" } });
  }

  findById(id: string) {
    return this.db.room.findUnique({ where: { id } });
  }

  create(input: CreateRoomInput) {
    return this.db.room.create({ data: input });
  }

  async delete(id: string) {
    const result = await this.db.room.deleteMany({ where: { id } });
    return result.count > 0;
  }
}
