import {
  DEFAULT_OBJECT_PROMPTS,
  type CreateRoomData,
  type UpdateRoomInput,
} from "@sitememory/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import type {
  RoomRepository,
  StoredRoom,
} from "../repositories/room-repository.js";

class MemoryRoomRepository implements RoomRepository {
  rooms = new Map<string, StoredRoom>();

  async list() {
    return [...this.rooms.values()];
  }

  async findById(id: string) {
    return this.rooms.get(id) ?? null;
  }

  async create(input: CreateRoomData) {
    const now = new Date("2026-10-30T12:00:00.000Z");
    const room: StoredRoom = {
      id: `room-${this.rooms.size + 1}`,
      name: input.name,
      description: input.description ?? null,
      objectPrompts: input.objectPrompts,
      createdAt: now,
      updatedAt: now,
    };
    this.rooms.set(room.id, room);
    return room;
  }

  async update(id: string, input: UpdateRoomInput) {
    const room = this.rooms.get(id);
    if (!room) return null;
    const updated = { ...room, ...input, updatedAt: new Date() };
    this.rooms.set(id, updated);
    return updated;
  }

  async delete(id: string) {
    return this.rooms.delete(id);
  }
}

describe("room routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp({ roomRepository: new MemoryRoomRepository() });
  });

  afterEach(async () => {
    await app.close();
  });

  it("creates and lists a room", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { name: "Home office", description: "Upstairs workspace" },
    });

    expect(created.statusCode).toBe(201);
    expect(created.json().data.name).toBe("Home office");
    expect(created.json().data.objectPrompts).toEqual(DEFAULT_OBJECT_PROMPTS);

    const listed = await app.inject({ method: "GET", url: "/api/rooms" });
    expect(listed.json().data).toHaveLength(1);
  });

  it("updates the room tracking vocabulary", async () => {
    await app.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { name: "Garage" },
    });
    const response = await app.inject({
      method: "PATCH",
      url: "/api/rooms/room-1",
      payload: { objectPrompts: ["drill", "safety glasses"] },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.objectPrompts).toEqual([
      "drill",
      "safety glasses",
    ]);
  });

  it("returns a useful validation response", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { name: "" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("deletes a room", async () => {
    await app.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { name: "Garage" },
    });
    const response = await app.inject({
      method: "DELETE",
      url: "/api/rooms/room-1",
    });
    expect(response.statusCode).toBe(204);
  });
});
