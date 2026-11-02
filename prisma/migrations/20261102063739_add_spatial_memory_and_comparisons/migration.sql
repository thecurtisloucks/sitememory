-- CreateTable
CREATE TABLE "TrackedObject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrackedObject_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScanComparison" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "sourceScanId" TEXT NOT NULL,
    "targetScanId" TEXT NOT NULL,
    "results" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScanComparison_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScanComparison_sourceScanId_fkey" FOREIGN KEY ("sourceScanId") REFERENCES "Scan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScanComparison_targetScanId_fkey" FOREIGN KEY ("targetScanId") REFERENCES "Scan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ObjectObservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanId" TEXT NOT NULL,
    "trackedObjectId" TEXT,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "boundingBox" TEXT NOT NULL,
    "maskReference" TEXT,
    "confidence" REAL,
    "matchStatus" TEXT NOT NULL DEFAULT 'UNMATCHED',
    "matchingConfidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ObjectObservation_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ObjectObservation_trackedObjectId_fkey" FOREIGN KEY ("trackedObjectId") REFERENCES "TrackedObject" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ObjectObservation" ("boundingBox", "confidence", "createdAt", "description", "id", "label", "maskReference", "scanId") SELECT "boundingBox", "confidence", "createdAt", "description", "id", "label", "maskReference", "scanId" FROM "ObjectObservation";
DROP TABLE "ObjectObservation";
ALTER TABLE "new_ObjectObservation" RENAME TO "ObjectObservation";
CREATE INDEX "ObjectObservation_scanId_idx" ON "ObjectObservation"("scanId");
CREATE INDEX "ObjectObservation_trackedObjectId_idx" ON "ObjectObservation"("trackedObjectId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TrackedObject_roomId_label_idx" ON "TrackedObject"("roomId", "label");

-- CreateIndex
CREATE INDEX "ScanComparison_roomId_createdAt_idx" ON "ScanComparison"("roomId", "createdAt");
