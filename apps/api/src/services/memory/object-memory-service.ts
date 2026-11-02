import type { PrismaClient } from "@prisma/client";
import type {
  ObjectObservation,
  Scan,
  TrackedObjectHistory,
  TrackedObjectSummary,
} from "@sitememory/shared";
import { HttpError } from "../../lib/errors.js";
import {
  serializeObservation,
  type ObservationRecord,
} from "../scan-service.js";

type ObservationWithScan = ObservationRecord & {
  scan: { id: string; capturedAt: Date; provider: string };
};

function observationWithScan(observation: ObservationWithScan) {
  return {
    ...serializeObservation(observation),
    scan: {
      id: observation.scan.id,
      imageUrl: `/api/scans/${observation.scan.id}/image`,
      capturedAt: observation.scan.capturedAt.toISOString(),
      provider: observation.scan.provider as Scan["provider"],
    },
  } satisfies ObjectObservation & {
    scan: Pick<Scan, "id" | "imageUrl" | "capturedAt" | "provider">;
  };
}

export class ObjectMemoryService {
  constructor(private readonly db: PrismaClient) {}

  async list(roomId: string): Promise<TrackedObjectSummary[]> {
    const room = await this.db.room.findUnique({
      where: { id: roomId },
      select: { id: true },
    });
    if (!room) throw new HttpError(404, "ROOM_NOT_FOUND", "Room not found");
    const objects = await this.db.trackedObject.findMany({
      where: { roomId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { observations: true } },
        observations: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            scan: { select: { id: true, capturedAt: true, provider: true } },
          },
        },
      },
    });
    return objects.map((object) => ({
      id: object.id,
      roomId: object.roomId,
      label: object.label,
      description: object.description,
      createdAt: object.createdAt.toISOString(),
      updatedAt: object.updatedAt.toISOString(),
      observationCount: object._count.observations,
      latestObservation: object.observations[0]
        ? observationWithScan(object.observations[0])
        : null,
    }));
  }

  async history(objectId: string): Promise<TrackedObjectHistory> {
    const object = await this.db.trackedObject.findUnique({
      where: { id: objectId },
      include: {
        observations: {
          orderBy: { createdAt: "desc" },
          include: {
            scan: { select: { id: true, capturedAt: true, provider: true } },
          },
        },
      },
    });
    if (!object)
      throw new HttpError(404, "OBJECT_NOT_FOUND", "Tracked object not found");
    const observations = object.observations.map(observationWithScan);
    return {
      id: object.id,
      roomId: object.roomId,
      label: object.label,
      description: object.description,
      createdAt: object.createdAt.toISOString(),
      updatedAt: object.updatedAt.toISOString(),
      observationCount: observations.length,
      latestObservation: observations[0] ?? null,
      observations,
    };
  }
}
