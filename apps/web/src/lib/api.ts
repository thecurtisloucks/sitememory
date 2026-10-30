import type {
  ApiError,
  ApiSuccess,
  CreateRoomInput,
  Room,
} from "@sitememory/shared";

const baseUrl = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(
      body?.error.message ?? `Request failed (${response.status})`,
    );
  }

  if (response.status === 204) return undefined as T;
  return ((await response.json()) as ApiSuccess<T>).data;
}

export const roomsApi = {
  list: () => request<Room[]>("/api/rooms"),
  get: (id: string) => request<Room>(`/api/rooms/${id}`),
  create: (input: CreateRoomInput) =>
    request<Room>("/api/rooms", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  delete: (id: string) =>
    request<void>(`/api/rooms/${id}`, { method: "DELETE" }),
};
