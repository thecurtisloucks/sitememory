import type { CreateRoomData, UpdateRoomInput } from "@sitememory/shared";

export interface StoredRoom {
  id: string;
  name: string;
  description: string | null;
  objectPrompts: string[];
  createdAt: Date;
  updatedAt: Date;
  latestScan?: {
    id: string;
    capturedAt: Date;
    status: string;
    provider: string;
  } | null;
}

export interface RoomRepository {
  list(): Promise<StoredRoom[]>;
  findById(id: string): Promise<StoredRoom | null>;
  create(input: CreateRoomData): Promise<StoredRoom>;
  update(id: string, input: UpdateRoomInput): Promise<StoredRoom | null>;
  delete(id: string): Promise<boolean>;
}
