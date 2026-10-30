import { z } from "zod";

export const roomNameSchema = z
  .string()
  .trim()
  .min(1, "Room name is required")
  .max(80, "Room name must be 80 characters or fewer");

export const createRoomSchema = z.object({
  name: roomNameSchema,
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .transform((value) => value || undefined),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export interface Room {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
