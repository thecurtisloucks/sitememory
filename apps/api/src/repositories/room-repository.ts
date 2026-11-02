import type { CreateRoomInput } from "@sitememory/shared";

export interface StoredRoom {
  id: string;
  name: string;
  description: string | null;
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
  create(input: CreateRoomInput): Promise<StoredRoom>;
  delete(id: string): Promise<boolean>;
}
