import type { PrismaClient } from "@prisma/client";
import {
  DEFAULT_OBJECT_PROMPTS,
  type CreateRoomData,
  type UpdateRoomInput,
} from "@sitememory/shared";
import type { RoomRepository } from "./room-repository.js";

function prompts(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
      ? parsed
      : [...DEFAULT_OBJECT_PROMPTS];
  } catch {
    return [...DEFAULT_OBJECT_PROMPTS];
  }
}

function roomRecord<T extends { objectPrompts: string }>(room: T) {
  return { ...room, objectPrompts: prompts(room.objectPrompts) };
}

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
      ...roomRecord(room),
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
    return { ...roomRecord(record), latestScan: scans[0] ?? null };
  }

  async create(input: CreateRoomData) {
    const { objectPrompts, ...room } = input;
    const created = await this.db.room.create({
      data: { ...room, objectPrompts: JSON.stringify(objectPrompts) },
    });
    return roomRecord(created);
  }

  async update(id: string, input: UpdateRoomInput) {
    const result = await this.db.room.updateMany({
      where: { id },
      data: { objectPrompts: JSON.stringify(input.objectPrompts) },
    });
    return result.count > 0 ? this.findById(id) : null;
  }

  async delete(id: string) {
    const result = await this.db.room.deleteMany({ where: { id } });
    return result.count > 0;
  }
}
