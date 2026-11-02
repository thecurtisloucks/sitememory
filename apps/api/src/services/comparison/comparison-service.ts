import type { PrismaClient } from "@prisma/client";
import type { ScanComparison } from "@sitememory/shared";
import { HttpError } from "../../lib/errors.js";
import type { ScanService } from "../scan-service.js";
import { classifyChanges } from "./change-classifier.js";

export class ComparisonService {
  constructor(
    private readonly db: PrismaClient,
    private readonly scans: ScanService,
  ) {}

  async compare(roomId: string, sourceScanId: string, targetScanId: string) {
    if (sourceScanId === targetScanId) {
      throw new HttpError(
        400,
        "SAME_SCAN",
        "Choose two different scans to compare.",
      );
    }
    const [sourceScan, targetScan] = await Promise.all([
      this.scans.get(sourceScanId),
      this.scans.get(targetScanId),
    ]);
    if (sourceScan.roomId !== roomId || targetScan.roomId !== roomId) {
      throw new HttpError(
        400,
        "SCAN_ROOM_MISMATCH",
        "Both scans must belong to this room.",
      );
    }
    if (
      sourceScan.status !== "COMPLETED" ||
      targetScan.status !== "COMPLETED"
    ) {
      throw new HttpError(
        409,
        "SCANS_NOT_READY",
        "Both scans must finish processing first.",
      );
    }
    const changes = classifyChanges(
      sourceScan.observations,
      targetScan.observations,
    );
    const comparison = await this.db.scanComparison.create({
      data: {
        roomId,
        sourceScanId,
        targetScanId,
        results: JSON.stringify(changes),
      },
    });
    return {
      id: comparison.id,
      roomId,
      sourceScanId,
      targetScanId,
      createdAt: comparison.createdAt.toISOString(),
      changes,
      sourceScan,
      targetScan,
    } satisfies ScanComparison;
  }

  async get(comparisonId: string) {
    const comparison = await this.db.scanComparison.findUnique({
      where: { id: comparisonId },
    });
    if (!comparison) {
      throw new HttpError(404, "COMPARISON_NOT_FOUND", "Comparison not found");
    }
    const [sourceScan, targetScan] = await Promise.all([
      this.scans.get(comparison.sourceScanId),
      this.scans.get(comparison.targetScanId),
    ]);
    return {
      id: comparison.id,
      roomId: comparison.roomId,
      sourceScanId: comparison.sourceScanId,
      targetScanId: comparison.targetScanId,
      createdAt: comparison.createdAt.toISOString(),
      changes: JSON.parse(comparison.results),
      sourceScan,
      targetScan,
    } as ScanComparison;
  }
}
