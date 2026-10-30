import type { CreateRoomInput } from "@sitememory/shared";

export interface StoredRoom {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomRepository {
  list(): Promise<StoredRoom[]>;
  findById(id: string): Promise<StoredRoom | null>;
  create(input: CreateRoomInput): Promise<StoredRoom>;
  delete(id: string): Promise<boolean>;
}
