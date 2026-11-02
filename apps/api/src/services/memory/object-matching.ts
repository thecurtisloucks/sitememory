import type { BoundingBox } from "@sitememory/shared";

export const MATCH_THRESHOLD = 0.72;
export const UNCERTAIN_THRESHOLD = 0.55;

export interface MatchableObservation {
  label: string;
  description: string;
  boundingBox: BoundingBox;
}

export interface MatchCandidate extends MatchableObservation {
  trackedObjectId: string;
}

export interface MatchDecision {
  trackedObjectId: string | null;
  candidateTrackedObjectId: string | null;
  status: "NEW" | "MATCHED" | "UNCERTAIN";
  score: number | null;
}

function words(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 2 &&
          !["the", "with", "from", "segmented"].includes(word),
      ),
  );
}

function descriptionSimilarity(left: string, right: string) {
  const leftWords = words(left);
  const rightWords = words(right);
  if (leftWords.size === 0 || rightWords.size === 0) return 0;
  const intersection = [...leftWords].filter((word) =>
    rightWords.has(word),
  ).length;
  const union = new Set([...leftWords, ...rightWords]).size;
  return intersection / union;
}

export function centerDistance(left: BoundingBox, right: BoundingBox) {
  const leftX = left.x + left.width / 2;
  const leftY = left.y + left.height / 2;
  const rightX = right.x + right.width / 2;
  const rightY = right.y + right.height / 2;
  return Math.hypot(leftX - rightX, leftY - rightY);
}

export function scoreObservationMatch(
  observation: MatchableObservation,
  candidate: MatchableObservation,
) {
  if (observation.label.toLowerCase() !== candidate.label.toLowerCase())
    return 0;
  const position = Math.max(
    0,
    1 -
      centerDistance(observation.boundingBox, candidate.boundingBox) /
        Math.SQRT2,
  );
  const leftArea =
    observation.boundingBox.width * observation.boundingBox.height;
  const rightArea = candidate.boundingBox.width * candidate.boundingBox.height;
  const dimensions =
    Math.max(leftArea, rightArea) === 0
      ? 0
      : 1 - Math.abs(leftArea - rightArea) / Math.max(leftArea, rightArea);
  return (
    0.45 +
    descriptionSimilarity(observation.description, candidate.description) *
      0.15 +
    position * 0.3 +
    Math.max(0, dimensions) * 0.1
  );
}

export function matchObservations(
  observations: readonly MatchableObservation[],
  candidates: readonly MatchCandidate[],
): MatchDecision[] {
  const used = new Set<string>();
  return observations.map((observation) => {
    const compatible = candidates
      .filter(
        (candidate) =>
          !used.has(candidate.trackedObjectId) &&
          candidate.label.toLowerCase() === observation.label.toLowerCase(),
      )
      .map((candidate) => ({
        candidate,
        score: scoreObservationMatch(observation, candidate),
      }))
      .sort((left, right) => right.score - left.score);
    const best = compatible[0];
    if (!best) {
      return {
        trackedObjectId: null,
        candidateTrackedObjectId: null,
        status: "NEW",
        score: null,
      };
    }
    if (best.score >= MATCH_THRESHOLD) {
      used.add(best.candidate.trackedObjectId);
      return {
        trackedObjectId: best.candidate.trackedObjectId,
        candidateTrackedObjectId: best.candidate.trackedObjectId,
        status: "MATCHED",
        score: best.score,
      };
    }
    return {
      trackedObjectId: null,
      candidateTrackedObjectId: best.candidate.trackedObjectId,
      status: "UNCERTAIN",
      score: best.score,
    };
  });
}
