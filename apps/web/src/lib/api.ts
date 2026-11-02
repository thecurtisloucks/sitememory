import type {
  ApiError,
  ApiSuccess,
  CreateRoomInput,
  Room,
  Scan,
  ScanComparison,
  TrackedObjectHistory,
  TrackedObjectSummary,
} from "@sitememory/shared";

const baseUrl = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(typeof init?.body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
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

function normalizeScan(scan: Scan): Scan {
  return { ...scan, imageUrl: `${baseUrl}${scan.imageUrl}` };
}

function normalizeRoom(room: Room): Room {
  return {
    ...room,
    latestScan: room.latestScan
      ? {
          ...room.latestScan,
          imageUrl: `${baseUrl}${room.latestScan.imageUrl}`,
        }
      : null,
  };
}

export const roomsApi = {
  list: async () => (await request<Room[]>("/api/rooms")).map(normalizeRoom),
  get: async (id: string) =>
    normalizeRoom(await request<Room>(`/api/rooms/${id}`)),
  create: async (input: CreateRoomInput) =>
    normalizeRoom(
      await request<Room>("/api/rooms", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    ),
  delete: (id: string) =>
    request<void>(`/api/rooms/${id}`, { method: "DELETE" }),
};

export const scansApi = {
  list: async (roomId: string) =>
    (await request<Scan[]>(`/api/rooms/${roomId}/scans`)).map(normalizeScan),
  get: async (scanId: string) =>
    normalizeScan(await request<Scan>(`/api/scans/${scanId}`)),
  upload: async (roomId: string, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return normalizeScan(
      await request<Scan>(`/api/rooms/${roomId}/scans`, {
        method: "POST",
        body: form,
      }),
    );
  },
  process: async (scanId: string) =>
    normalizeScan(
      await request<Scan>(`/api/scans/${scanId}/process`, { method: "POST" }),
    ),
};

function normalizeObservationScan<
  T extends TrackedObjectSummary | TrackedObjectHistory,
>(object: T): T {
  const normalizeObservation = (
    observation: NonNullable<TrackedObjectSummary["latestObservation"]>,
  ) => ({
    ...observation,
    scan: {
      ...observation.scan,
      imageUrl: `${baseUrl}${observation.scan.imageUrl}`,
    },
  });
  return {
    ...object,
    latestObservation: object.latestObservation
      ? normalizeObservation(object.latestObservation)
      : null,
    ...("observations" in object
      ? { observations: object.observations.map(normalizeObservation) }
      : {}),
  } as T;
}

function normalizeComparison(comparison: ScanComparison): ScanComparison {
  return {
    ...comparison,
    sourceScan: normalizeScan(comparison.sourceScan),
    targetScan: normalizeScan(comparison.targetScan),
  };
}

export const objectsApi = {
  list: async (roomId: string) =>
    (await request<TrackedObjectSummary[]>(`/api/rooms/${roomId}/objects`)).map(
      normalizeObservationScan,
    ),
  history: async (objectId: string) =>
    normalizeObservationScan(
      await request<TrackedObjectHistory>(`/api/objects/${objectId}/history`),
    ),
};

export const comparisonsApi = {
  create: async (roomId: string, sourceScanId: string, targetScanId: string) =>
    normalizeComparison(
      await request<ScanComparison>(`/api/rooms/${roomId}/compare`, {
        method: "POST",
        body: JSON.stringify({ sourceScanId, targetScanId }),
      }),
    ),
  get: async (comparisonId: string) =>
    normalizeComparison(
      await request<ScanComparison>(`/api/comparisons/${comparisonId}`),
    ),
};
