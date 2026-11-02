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

export const scanStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export type ScanStatus = z.infer<typeof scanStatusSchema>;

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SegmentationMask {
  kind: "svg-path";
  path: string;
  width: number;
  height: number;
}

export interface ObjectObservation {
  id: string;
  scanId: string;
  label: string;
  description: string;
  boundingBox: BoundingBox;
  mask: SegmentationMask | null;
  confidence: number | null;
  trackedObjectId: string | null;
  matchStatus: "NEW" | "MATCHED" | "UNCERTAIN" | "UNMATCHED";
  matchingConfidence: number | null;
  createdAt: string;
}

export interface Scan {
  id: string;
  roomId: string;
  imageUrl: string;
  originalFilename: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  byteSize: number;
  width: number;
  height: number;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
  status: ScanStatus;
  errorMessage: string | null;
  provider: "mock" | "meta";
  observations: ObjectObservation[];
}

export interface TrackedObjectSummary {
  id: string;
  roomId: string;
  label: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  observationCount: number;
  latestObservation:
    | (ObjectObservation & {
        scan: Pick<Scan, "id" | "imageUrl" | "capturedAt" | "provider">;
      })
    | null;
}

export interface TrackedObjectHistory extends TrackedObjectSummary {
  observations: Array<
    ObjectObservation & {
      scan: Pick<Scan, "id" | "imageUrl" | "capturedAt" | "provider">;
    }
  >;
}

export type ChangeClassification =
  "UNCHANGED" | "MOVED" | "NEWLY_VISIBLE" | "NO_LONGER_VISIBLE" | "UNCERTAIN";

export interface ComparisonChange {
  classification: ChangeClassification;
  label: string;
  sourceObservationId: string | null;
  targetObservationId: string | null;
  trackedObjectId: string | null;
  matchingScore: number | null;
  explanation: string;
}

export interface ScanComparison {
  id: string;
  roomId: string;
  sourceScanId: string;
  targetScanId: string;
  createdAt: string;
  changes: ComparisonChange[];
  sourceScan: Scan;
  targetScan: Scan;
}

export interface AssistantEvidence {
  observationId: string;
  scanId: string;
  trackedObjectId: string | null;
  label: string;
  description: string;
  capturedAt: string;
  imageUrl: string;
  boundingBox: BoundingBox;
}

export interface AssistantAnswer {
  answer: string;
  provider: "mock" | "meta";
  evidence: AssistantEvidence[];
  supportingScanIds: string[];
  supportingObservationIds: string[];
  uncertaintyNotes: string[];
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  latestScan: {
    id: string;
    imageUrl: string;
    capturedAt: string;
    status: ScanStatus;
    provider: "mock" | "meta";
  } | null;
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
