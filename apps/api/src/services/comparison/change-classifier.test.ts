import type { ObjectObservation } from "@sitememory/shared";
import { describe, expect, it } from "vitest";
import { classifyChanges } from "./change-classifier.js";

function observation(
  id: string,
  label: string,
  x: number,
  trackedObjectId: string | null,
  matchStatus: ObjectObservation["matchStatus"] = "MATCHED",
): ObjectObservation {
  return {
    id,
    scanId: id.startsWith("source") ? "source" : "target",
    label,
    description: `${label} on desk`,
    boundingBox: { x, y: 0.2, width: 0.2, height: 0.2 },
    mask: null,
    confidence: null,
    trackedObjectId,
    matchStatus,
    matchingConfidence: matchStatus === "MATCHED" ? 0.9 : null,
    createdAt: "2026-11-02T00:00:00.000Z",
  };
}

describe("change classification", () => {
  it("classifies unchanged, moved, newly visible, and no longer visible objects", () => {
    const changes = classifyChanges(
      [
        observation("source-mug", "coffee mug", 0.1, "mug"),
        observation("source-book", "notebook", 0.2, "book"),
        observation("source-headphones", "headphones", 0.6, "headphones"),
      ],
      [
        observation("target-mug", "coffee mug", 0.12, "mug"),
        observation("target-book", "notebook", 0.55, "book"),
        observation("target-keyboard", "keyboard", 0.3, "keyboard"),
      ],
    );

    expect(changes.map((item) => item.classification)).toEqual([
      "UNCHANGED",
      "MOVED",
      "NO_LONGER_VISIBLE",
      "NEWLY_VISIBLE",
    ]);
  });

  it("does not force an uncertain identity into a movement claim", () => {
    const changes = classifyChanges(
      [observation("source-book", "notebook", 0.1, null, "UNCERTAIN")],
      [observation("target-book", "notebook", 0.65, null, "UNCERTAIN")],
    );
    expect(changes[0]?.classification).toBe("UNCERTAIN");
  });
});
