import type { BoundingBox } from "@sitememory/shared";
import type { ReasoningInput, ReasoningProvider } from "./types.js";

function position(box: BoundingBox) {
  const horizontal =
    box.x + box.width / 2 < 0.34
      ? "left"
      : box.x + box.width / 2 > 0.66
        ? "right"
        : "center";
  const vertical =
    box.y + box.height / 2 < 0.34
      ? "upper"
      : box.y + box.height / 2 > 0.66
        ? "lower"
        : "middle";
  return `${vertical}-${horizontal} area of the image`;
}

function changeSummary(input: ReasoningInput) {
  if (input.changes.length === 0) return null;
  return input.changes
    .map(
      (change) =>
        `${change.label}: ${change.classification.toLowerCase().replaceAll("_", " ")}`,
    )
    .join("; ");
}

export class MockReasoningProvider implements ReasoningProvider {
  readonly name = "mock" as const;

  async answerQuestion(input: ReasoningInput) {
    const asksAboutChanges = /change|moved|visible|different/i.test(
      input.question,
    );
    const changes = asksAboutChanges ? changeSummary(input) : null;
    if (changes) {
      return {
        provider: this.name,
        answer: `Based on the two most recent completed scans: ${changes}.`,
      };
    }
    const latest = [...input.evidence].sort((left, right) =>
      right.capturedAt.localeCompare(left.capturedAt),
    )[0];
    if (!latest) {
      return {
        provider: this.name,
        answer:
          "I could not find an observation in this room that supports an answer to that question.",
      };
    }
    return {
      provider: this.name,
      answer: `The latest supporting observation shows ${latest.label} in the ${position(latest.boundingBox)}, captured ${new Date(latest.capturedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC.`,
    };
  }
}
