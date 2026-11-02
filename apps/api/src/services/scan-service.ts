import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import type {
  ObjectObservation,
  Scan,
  ScanStatus,
  SegmentationMask,
} from "@sitememory/shared";
import { DEFAULT_OBJECT_PROMPTS } from "@sitememory/shared";
import { HttpError } from "../lib/errors.js";
import type { AllowedImageType, ImageStorage } from "./image-storage.js";
import { matchObservations } from "./memory/object-matching.js";
import type { VisionProvider } from "./vision/index.js";

export interface CreateScanInput {
  roomId: string;
  bytes: Buffer;
  originalFilename: string;
}

export interface ScanImage {
  bytes: Buffer;
  mimeType: AllowedImageType;
}

export interface ScanService {
  list(roomId: string): Promise<Scan[]>;
  get(scanId: string): Promise<Scan>;
  create(input: CreateScanInput): Promise<Scan>;
  process(scanId: string): Promise<Scan>;
  image(scanId: string): Promise<ScanImage>;
  deleteFilesForRoom(roomId: string): Promise<void>;
}

export type ObservationRecord = {
  id: string;
  scanId: string;
  trackedObjectId: string | null;
  label: string;
  description: string;
  boundingBox: string;
  maskReference: string | null;
  confidence: number | null;
  matchStatus: string;
  matchingConfidence: number | null;
  createdAt: Date;
};

type ScanRecord = {
  id: string;
  roomId: string;
  imagePath: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  capturedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  errorMessage: string | null;
  provider: string;
  observations?: ObservationRecord[];
};

export function safeJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function sanitizeFilename(filename: string) {
  return (
    path
      .basename(filename || "upload")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .slice(0, 200) || "upload"
  );
}

export function serializeObservation(
  observation: ObservationRecord,
): ObjectObservation {
  return {
    id: observation.id,
    scanId: observation.scanId,
    label: observation.label,
    description: observation.description,
    boundingBox: safeJson(observation.boundingBox, {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }),
    mask: safeJson<SegmentationMask | null>(observation.maskReference, null),
    confidence: observation.confidence,
    trackedObjectId: observation.trackedObjectId,
    matchStatus: observation.matchStatus as ObjectObservation["matchStatus"],
    matchingConfidence: observation.matchingConfidence,
    createdAt: observation.createdAt.toISOString(),
  };
}

export function serializeScan(scan: ScanRecord): Scan {
  return {
    id: scan.id,
    roomId: scan.roomId,
    imageUrl: `/api/scans/${scan.id}/image`,
    originalFilename: scan.originalFilename,
    mimeType: scan.mimeType as Scan["mimeType"],
    byteSize: scan.byteSize,
    width: scan.width,
    height: scan.height,
    capturedAt: scan.capturedAt.toISOString(),
    createdAt: scan.createdAt.toISOString(),
    updatedAt: scan.updatedAt.toISOString(),
    status: scan.status as ScanStatus,
    errorMessage: scan.errorMessage,
    provider: scan.provider as Scan["provider"],
    observations: (scan.observations ?? []).map(serializeObservation),
  };
}

export class PrismaScanService implements ScanService {
  constructor(
    private readonly db: PrismaClient,
    private readonly storage: ImageStorage,
    private readonly provider: VisionProvider,
  ) {}

  async list(roomId: string) {
    const room = await this.db.room.findUnique({
      where: { id: roomId },
      select: { id: true },
    });
    if (!room) throw new HttpError(404, "ROOM_NOT_FOUND", "Room not found");
    const scans = await this.db.scan.findMany({
      where: { roomId },
      include: { observations: { orderBy: { createdAt: "asc" } } },
      orderBy: { capturedAt: "desc" },
    });
    return scans.map(serializeScan);
  }

  async get(scanId: string) {
    const scan = await this.db.scan.findUnique({
      where: { id: scanId },
      include: { observations: { orderBy: { createdAt: "asc" } } },
    });
    if (!scan) throw new HttpError(404, "SCAN_NOT_FOUND", "Scan not found");
    return serializeScan(scan);
  }

  async create(input: CreateScanInput) {
    const room = await this.db.room.findUnique({
      where: { id: input.roomId },
      select: { id: true },
    });
    if (!room) throw new HttpError(404, "ROOM_NOT_FOUND", "Room not found");
    const image = await this.storage.validate(input.bytes);
    const imagePath = await this.storage.save(image);
    try {
      const scan = await this.db.scan.create({
        data: {
          roomId: input.roomId,
          imagePath,
          originalFilename: sanitizeFilename(input.originalFilename),
          mimeType: image.mimeType,
          byteSize: image.bytes.length,
          width: image.width,
          height: image.height,
          provider: this.provider.name,
        },
        include: { observations: true },
      });
      await this.db.room.update({
        where: { id: input.roomId },
        data: { updatedAt: new Date() },
      });
      return serializeScan(scan);
    } catch (error) {
      await this.storage.remove(imagePath);
      throw error;
    }
  }

  async process(scanId: string) {
    const scan = await this.db.scan.findUnique({ where: { id: scanId } });
    if (!scan) throw new HttpError(404, "SCAN_NOT_FOUND", "Scan not found");
    if (scan.status === "PROCESSING") {
      throw new HttpError(
        409,
        "SCAN_PROCESSING",
        "This scan is already processing.",
      );
    }
    await this.db.scan.update({
      where: { id: scanId },
      data: {
        status: "PROCESSING",
        errorMessage: null,
        provider: this.provider.name,
      },
    });

    try {
      const bytes = await this.storage.read(scan.imagePath);
      const room = await this.db.room.findUnique({
        where: { id: scan.roomId },
        select: { objectPrompts: true },
      });
      const configuredPrompts = safeJson<string[]>(
        room?.objectPrompts ?? null,
        [...DEFAULT_OBJECT_PROMPTS],
      ).slice(0, 12);
      const result = await this.provider.segmentImage({
        bytes,
        mimeType: scan.mimeType as AllowedImageType,
        width: scan.width,
        height: scan.height,
        prompts:
          configuredPrompts.length > 0
            ? configuredPrompts
            : [...DEFAULT_OBJECT_PROMPTS],
      });
      await this.db.$transaction(async (transaction) => {
        await transaction.objectObservation.deleteMany({ where: { scanId } });
        await transaction.trackedObject.deleteMany({
          where: { roomId: scan.roomId, observations: { none: {} } },
        });
        const trackedObjects = await transaction.trackedObject.findMany({
          where: { roomId: scan.roomId },
          include: {
            observations: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        });
        const candidates = trackedObjects.flatMap((trackedObject) => {
          const latest = trackedObject.observations[0];
          return latest
            ? [
                {
                  trackedObjectId: trackedObject.id,
                  label: trackedObject.label,
                  description: latest.description,
                  boundingBox: safeJson(latest.boundingBox, {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                  }),
                },
              ]
            : [];
        });
        const decisions = matchObservations(result.objects, candidates);
        for (let index = 0; index < result.objects.length; index += 1) {
          const object = result.objects[index];
          const decision = decisions[index];
          if (!object || !decision) continue;
          let trackedObjectId = decision.trackedObjectId;
          if (decision.status === "NEW") {
            const tracked = await transaction.trackedObject.create({
              data: {
                roomId: scan.roomId,
                label: object.label,
                description: object.description,
              },
            });
            trackedObjectId = tracked.id;
          } else if (trackedObjectId) {
            await transaction.trackedObject.update({
              where: { id: trackedObjectId },
              data: { updatedAt: new Date() },
            });
          }
          await transaction.objectObservation.create({
            data: {
              scanId,
              trackedObjectId,
              label: object.label,
              description: object.description,
              boundingBox: JSON.stringify(object.boundingBox),
              maskReference: object.mask ? JSON.stringify(object.mask) : null,
              confidence: object.confidence,
              matchStatus: decision.status,
              matchingConfidence: decision.score,
            },
          });
        }
        await transaction.scan.update({
          where: { id: scanId },
          data: {
            status: "COMPLETED",
            provider: result.provider,
            errorMessage: null,
            rawResponse: result.rawResponse
              ? JSON.stringify(result.rawResponse)
              : null,
          },
        });
      });
      return this.get(scanId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Image processing failed.";
      await this.db.scan.update({
        where: { id: scanId },
        data: { status: "FAILED", errorMessage: message.slice(0, 500) },
      });
      if (error instanceof HttpError) throw error;
      throw new HttpError(502, "PROCESSING_FAILED", message);
    }
  }

  async image(scanId: string) {
    const scan = await this.db.scan.findUnique({
      where: { id: scanId },
      select: { imagePath: true, mimeType: true },
    });
    if (!scan) throw new HttpError(404, "SCAN_NOT_FOUND", "Scan not found");
    return {
      bytes: await this.storage.read(scan.imagePath),
      mimeType: scan.mimeType as AllowedImageType,
    };
  }

  async deleteFilesForRoom(roomId: string) {
    const scans = await this.db.scan.findMany({
      where: { roomId },
      select: { imagePath: true },
    });
    await Promise.all(scans.map((scan) => this.storage.remove(scan.imagePath)));
  }
}
