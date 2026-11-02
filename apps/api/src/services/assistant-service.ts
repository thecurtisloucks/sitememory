import type { PrismaClient } from "@prisma/client";
import type {
  AssistantAnswer,
  AssistantEvidence,
  ComparisonChange,
  ObjectObservation,
} from "@sitememory/shared";
import { HttpError } from "../lib/errors.js";
import { classifyChanges } from "./comparison/change-classifier.js";
import { safeJson, serializeObservation } from "./scan-service.js";
import type { ReasoningProvider } from "./reasoning/index.js";

const MAX_EVIDENCE = 12;

type EvidenceRecord = {
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
  scan: { capturedAt: Date };
};

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
}

function labelMatchesQuestion(question: string, label: string) {
  const haystack = ` ${normalized(question)} `;
  const needle = normalized(label).trim();
  return haystack.includes(` ${needle} `) || haystack.includes(` ${needle}s `);
}

export function isChangeQuestion(question: string) {
  return /\b(change|changed|different|moved|visible|missing|disappear|summary|summarize)\b/i.test(
    question,
  );
}

function toEvidence(observation: EvidenceRecord): AssistantEvidence {
  return {
    observationId: observation.id,
    scanId: observation.scanId,
    trackedObjectId: observation.trackedObjectId,
    label: observation.label,
    description: observation.description,
    capturedAt: observation.scan.capturedAt.toISOString(),
    imageUrl: `/api/scans/${observation.scanId}/image`,
    boundingBox: safeJson(observation.boundingBox, {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }),
  };
}

function asObservation(observation: EvidenceRecord): ObjectObservation {
  return serializeObservation(observation);
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function observationsForRequestedDay(
  question: string,
  observations: EvidenceRecord[],
  now = new Date(),
) {
  const offset = /\byesterday\b/i.test(question)
    ? -1
    : /\btoday\b/i.test(question)
      ? 0
      : null;
  if (offset === null) return observations;
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + offset,
    ),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return observations.filter(
    (observation) =>
      observation.scan.capturedAt >= start && observation.scan.capturedAt < end,
  );
}

export class AssistantService {
  constructor(
    private readonly db: PrismaClient,
    private readonly provider: ReasoningProvider,
  ) {}

  async ask(roomId: string, question: string): Promise<AssistantAnswer> {
    const room = await this.db.room.findUnique({
      where: { id: roomId },
      select: { id: true, name: true },
    });
    if (!room) throw new HttpError(404, "ROOM_NOT_FOUND", "Room not found");

    const scans = await this.db.scan.findMany({
      where: { roomId, status: "COMPLETED" },
      orderBy: { capturedAt: "desc" },
      include: {
        observations: { include: { scan: { select: { capturedAt: true } } } },
      },
    });
    const allObservations = scans
      .flatMap((scan) => scan.observations as EvidenceRecord[])
      .sort(
        (left, right) =>
          right.scan.capturedAt.getTime() - left.scan.capturedAt.getTime(),
      );
    const matchedLabels = unique(
      allObservations
        .map((observation) => observation.label)
        .filter((label) => labelMatchesQuestion(question, label)),
    );
    const changeQuestion = isChangeQuestion(question);
    const asksForSpecificObject =
      /\b(where|when|last|find|saw|seen)\b/i.test(question) &&
      !/\b(what|which|everything|objects?)\b/i.test(question);

    const timeFilteredObservations = observationsForRequestedDay(
      question,
      allObservations,
    );
    let relevant = timeFilteredObservations;
    if (matchedLabels.length > 0) {
      relevant = timeFilteredObservations.filter((observation) =>
        matchedLabels.includes(observation.label),
      );
    } else if (asksForSpecificObject && !changeQuestion) {
      relevant = [];
    } else if (!changeQuestion) {
      const seenObjects = new Set<string>();
      relevant = timeFilteredObservations.filter((observation) => {
        const identity = observation.trackedObjectId ?? observation.id;
        if (seenObjects.has(identity)) return false;
        seenObjects.add(identity);
        return true;
      });
    }

    let changes: ComparisonChange[] = [];
    if (changeQuestion && scans.length >= 2) {
      const target = scans[0]!;
      const source = scans[1]!;
      changes = classifyChanges(
        source.observations.map((observation) =>
          asObservation(observation as EvidenceRecord),
        ),
        target.observations.map((observation) =>
          asObservation(observation as EvidenceRecord),
        ),
      );
      const changeObservationIds = new Set(
        changes.flatMap((change) =>
          [change.sourceObservationId, change.targetObservationId].filter(
            (id): id is string => Boolean(id),
          ),
        ),
      );
      relevant = allObservations.filter((observation) =>
        changeObservationIds.has(observation.id),
      );
    }

    const evidence = relevant.slice(0, MAX_EVIDENCE).map(toEvidence);
    const uncertaintyNotes: string[] = [];
    if (evidence.length === 0) {
      uncertaintyNotes.push(
        "No stored observation directly supports this question.",
      );
    }
    if (changeQuestion && scans.length < 2) {
      uncertaintyNotes.push(
        "At least two completed scans are required to evaluate changes.",
      );
    }
    if (
      relevant.some((observation) => observation.matchStatus === "UNCERTAIN") ||
      changes.some((change) => change.classification === "UNCERTAIN")
    ) {
      uncertaintyNotes.push(
        "At least one possible object identity could not be confirmed.",
      );
    }

    try {
      const result = await this.provider.answerQuestion({
        roomName: room.name,
        question,
        evidence,
        changes,
      });
      return {
        answer: result.answer,
        provider: result.provider,
        evidence,
        supportingScanIds: unique(evidence.map((item) => item.scanId)),
        supportingObservationIds: evidence.map((item) => item.observationId),
        uncertaintyNotes,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Reasoning request failed.";
      throw new HttpError(502, "REASONING_FAILED", message);
    }
  }
}
