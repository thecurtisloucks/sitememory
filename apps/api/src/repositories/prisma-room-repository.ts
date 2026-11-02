import type { PrismaClient } from "@prisma/client";
import type { CreateRoomInput } from "@sitememory/shared";
import type { RoomRepository } from "./room-repository.js";

export class PrismaRoomRepository implements RoomRepository {
  constructor(private readonly db: PrismaClient) {}

  async list() {
    const rooms = await this.db.room.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        scans: {
          take: 1,
          orderBy: { capturedAt: "desc" },
          select: { id: true, capturedAt: true, status: true, provider: true },
        },
      },
    });
    return rooms.map(({ scans, ...room }) => ({
      ...room,
      latestScan: scans[0] ?? null,
    }));
  }

  async findById(id: string) {
    const room = await this.db.room.findUnique({
      where: { id },
      include: {
        scans: {
          take: 1,
          orderBy: { capturedAt: "desc" },
          select: { id: true, capturedAt: true, status: true, provider: true },
        },
      },
    });
    if (!room) return null;
    const { scans, ...record } = room;
    return { ...record, latestScan: scans[0] ?? null };
  }

  create(input: CreateRoomInput) {
    return this.db.room.create({ data: input });
  }

  async delete(id: string) {
    const result = await this.db.room.deleteMany({ where: { id } });
    return result.count > 0;
  }
}
