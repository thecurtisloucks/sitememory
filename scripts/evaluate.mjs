import fs from "node:fs/promises";
import { classifyChanges } from "../apps/api/dist/services/comparison/change-classifier.js";
import { matchObservations } from "../apps/api/dist/services/memory/object-matching.js";

const baseline = JSON.parse(
  await fs.readFile(
    new URL("../evaluation/sam-3.1-baseline.json", import.meta.url),
  ),
);
const expected = {
  before: ["headphones", "coffee mug", "notebook", "keyboard"],
  after: ["coffee mug", "notebook", "keyboard"],
  changes: {
    headphones: "NO_LONGER_VISIBLE",
    "coffee mug": "UNCHANGED",
    notebook: "MOVED",
    keyboard: "UNCHANGED",
  },
};

const predictions = [...baseline.fixtures.before, ...baseline.fixtures.after];
const expectedLabels = [...expected.before, ...expected.after];
const correctDetections = predictions.filter((prediction) => {
  const index = expectedLabels.indexOf(prediction.label);
  if (index < 0) return false;
  expectedLabels.splice(index, 1);
  return true;
}).length;
const detectionRecall = correctDetections / 7;
const detectionPrecision = correctDetections / predictions.length;
const meanConfidence =
  predictions.reduce((sum, prediction) => sum + prediction.confidence, 0) /
  predictions.length;

const beforeCandidates = baseline.fixtures.before.map((observation, index) => ({
  ...observation,
  trackedObjectId: `tracked-${index}-${observation.label}`,
}));
const decisions = matchObservations(baseline.fixtures.after, beforeCandidates);
const now = "2026-11-02T00:00:00.000Z";
const beforeObservations = beforeCandidates.map((observation, index) => ({
  id: `before-${index}`,
  scanId: "before-scan",
  ...observation,
  mask: null,
  matchStatus: "NEW",
  matchingConfidence: null,
  createdAt: now,
}));
const afterObservations = baseline.fixtures.after.map((observation, index) => {
  const decision = decisions[index];
  return {
    id: `after-${index}`,
    scanId: "after-scan",
    ...observation,
    mask: null,
    trackedObjectId:
      decision.status === "MATCHED" ? decision.trackedObjectId : null,
    matchStatus: decision.status,
    matchingConfidence: decision.score,
    createdAt: now,
  };
});
const changes = classifyChanges(beforeObservations, afterObservations);
const correctChanges = changes.filter(
  (change) => expected.changes[change.label] === change.classification,
).length;
const changeAccuracy = correctChanges / Object.keys(expected.changes).length;
const identityAccuracy =
  decisions.filter((decision) => decision.status === "MATCHED").length / 3;

const percent = (value) => `${(value * 100).toFixed(1)}%`;
console.log(`# SiteMemory evaluation\n`);
console.log(`Baseline: ${baseline.model} · ${baseline.capturedAt}\n`);
console.log(`| Metric | Result |`);
console.log(`| --- | ---: |`);
console.log(`| Detection recall | ${percent(detectionRecall)} |`);
console.log(`| Detection precision | ${percent(detectionPrecision)} |`);
console.log(`| Mean SAM confidence | ${percent(meanConfidence)} |`);
console.log(`| Cross-scan identity accuracy | ${percent(identityAccuracy)} |`);
console.log(`| Change classification accuracy | ${percent(changeAccuracy)} |`);
console.log(
  `\nClassifications: ${changes
    .map((change) => `${change.label}=${change.classification}`)
    .join(", ")}`,
);

if (
  detectionRecall < 1 ||
  detectionPrecision < 1 ||
  identityAccuracy < 1 ||
  changeAccuracy < 1
) {
  process.exitCode = 1;
}
