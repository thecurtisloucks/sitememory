import type { ComparisonChange, ObjectObservation } from "@sitememory/shared";
import {
  MATCH_THRESHOLD,
  UNCERTAIN_THRESHOLD,
  centerDistance,
  scoreObservationMatch,
} from "../memory/object-matching.js";

const UNCHANGED_DISTANCE = 0.08;

function change(
  classification: ComparisonChange["classification"],
  label: string,
  source: ObjectObservation | null,
  target: ObjectObservation | null,
  score: number | null,
  explanation: string,
): ComparisonChange {
  return {
    classification,
    label,
    sourceObservationId: source?.id ?? null,
    targetObservationId: target?.id ?? null,
    trackedObjectId: source?.trackedObjectId ?? target?.trackedObjectId ?? null,
    matchingScore: score,
    explanation,
  };
}

export function classifyChanges(
  sourceObservations: readonly ObjectObservation[],
  targetObservations: readonly ObjectObservation[],
) {
  const changes: ComparisonChange[] = [];
  const usedTargets = new Set<string>();

  for (const source of sourceObservations) {
    let target = source.trackedObjectId
      ? targetObservations.find(
          (candidate) =>
            !usedTargets.has(candidate.id) &&
            candidate.trackedObjectId === source.trackedObjectId,
        )
      : undefined;
    let score = target ? 1 : 0;

    if (!target) {
      const best = targetObservations
        .filter(
          (candidate) =>
            !usedTargets.has(candidate.id) &&
            candidate.label.toLowerCase() === source.label.toLowerCase(),
        )
        .map((candidate) => ({
          candidate,
          score: scoreObservationMatch(source, candidate),
        }))
        .sort((left, right) => right.score - left.score)[0];
      if (best && best.score >= UNCERTAIN_THRESHOLD) {
        target = best.candidate;
        score = best.score;
      }
    }

    if (!target) {
      changes.push(
        change(
          "NO_LONGER_VISIBLE",
          source.label,
          source,
          null,
          null,
          `${source.label} was observed previously but is not visible in the newer scan.`,
        ),
      );
      continue;
    }

    usedTargets.add(target.id);
    if (
      source.matchStatus === "UNCERTAIN" ||
      target.matchStatus === "UNCERTAIN" ||
      (score < MATCH_THRESHOLD &&
        source.trackedObjectId !== target.trackedObjectId)
    ) {
      changes.push(
        change(
          "UNCERTAIN",
          source.label,
          source,
          target,
          score,
          `The available evidence is insufficient to confirm whether these ${source.label} observations are the same object.`,
        ),
      );
      continue;
    }

    const distance = centerDistance(source.boundingBox, target.boundingBox);
    changes.push(
      change(
        distance <= UNCHANGED_DISTANCE ? "UNCHANGED" : "MOVED",
        source.label,
        source,
        target,
        score,
        distance <= UNCHANGED_DISTANCE
          ? `${source.label} appears in approximately the same location.`
          : `${source.label} appears in a different location.`,
      ),
    );
  }

  for (const target of targetObservations) {
    if (usedTargets.has(target.id)) continue;
    changes.push(
      change(
        "NEWLY_VISIBLE",
        target.label,
        null,
        target,
        null,
        `${target.label} is visible in the newer scan but was not observed in the earlier scan.`,
      ),
    );
  }

  return changes;
}
