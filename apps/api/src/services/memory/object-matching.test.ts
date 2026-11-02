import { describe, expect, it } from "vitest";
import { matchObservations, scoreObservationMatch } from "./object-matching.js";

const candidate = {
  trackedObjectId: "object-1",
  label: "notebook",
  description: "black spiral notebook on desk",
  boundingBox: { x: 0.2, y: 0.3, width: 0.25, height: 0.3 },
};

describe("object matching", () => {
  it("matches a compatible nearby observation", () => {
    const observation = {
      label: "notebook",
      description: "black spiral notebook on desk",
      boundingBox: { x: 0.22, y: 0.31, width: 0.24, height: 0.3 },
    };
    expect(scoreObservationMatch(observation, candidate)).toBeGreaterThan(0.9);
    expect(matchObservations([observation], [candidate])[0]).toMatchObject({
      trackedObjectId: "object-1",
      status: "MATCHED",
    });
  });

  it("represents an ambiguous same-category identity as uncertain", () => {
    const observation = {
      label: "notebook",
      description: "different notebook",
      boundingBox: { x: 0.75, y: 0.72, width: 0.18, height: 0.2 },
    };
    expect(matchObservations([observation], [candidate])[0]).toMatchObject({
      trackedObjectId: null,
      candidateTrackedObjectId: "object-1",
      status: "UNCERTAIN",
    });
  });

  it("does not assign one tracked object twice in a scan", () => {
    const observations = [
      candidate,
      { ...candidate, boundingBox: { ...candidate.boundingBox, x: 0.23 } },
    ];
    const decisions = matchObservations(observations, [candidate]);
    expect(decisions[0]?.status).toBe("MATCHED");
    expect(decisions[1]?.status).toBe("NEW");
  });
});
