import type { PrismaClient } from "@prisma/client";
import type { ReasoningProvider } from "./reasoning/index.js";
import { describe, expect, it, vi } from "vitest";
import { AssistantService } from "./assistant-service.js";

function observation(
  id: string,
  scanId: string,
  label: string,
  capturedAt: Date,
  x: number,
) {
  return {
    id,
    scanId,
    trackedObjectId: `${label}-object`,
    label,
    description: `${label} on desk`,
    boundingBox: JSON.stringify({ x, y: 0.2, width: 0.2, height: 0.2 }),
    maskReference: null,
    confidence: 0.9,
    matchStatus: "MATCHED",
    matchingConfidence: 0.9,
    createdAt: capturedAt,
    scan: { capturedAt },
  };
}

function setup() {
  const recent = new Date("2026-11-02T12:00:00.000Z");
  const earlier = new Date("2026-11-01T12:00:00.000Z");
  const scans = [
    {
      id: "scan-2",
      observations: [observation("obs-2", "scan-2", "headphones", recent, 0.7)],
    },
    {
      id: "scan-1",
      observations: [
        observation("obs-1", "scan-1", "headphones", earlier, 0.1),
      ],
    },
  ];
  const db = {
    room: {
      findUnique: vi.fn().mockResolvedValue({ id: "room-1", name: "Office" }),
    },
    scan: { findMany: vi.fn().mockResolvedValue(scans) },
  } as unknown as PrismaClient;
  const answerQuestion = vi.fn().mockImplementation(async (input) => ({
    provider: "mock" as const,
    answer: input.evidence.length ? "Grounded answer" : "No evidence",
  }));
  const provider = {
    name: "mock" as const,
    answerQuestion,
  } satisfies ReasoningProvider;
  return { service: new AssistantService(db, provider), answerQuestion };
}

describe("AssistantService", () => {
  it("retrieves matching observations and returns exact evidence references", async () => {
    const { service, answerQuestion } = setup();
    const result = await service.ask(
      "room-1",
      "Where were my headphones last seen?",
    );

    expect(result.answer).toBe("Grounded answer");
    expect(result.evidence.map((item) => item.observationId)).toEqual([
      "obs-2",
      "obs-1",
    ]);
    expect(result.supportingScanIds).toEqual(["scan-2", "scan-1"]);
    expect(answerQuestion).toHaveBeenCalledOnce();
  });

  it("does not substitute unrelated room evidence for an unknown object", async () => {
    const { service } = setup();
    const result = await service.ask(
      "room-1",
      "Where did I last see my wallet?",
    );

    expect(result.evidence).toEqual([]);
    expect(result.answer).toBe("No evidence");
    expect(result.uncertaintyNotes).toContain(
      "No stored observation directly supports this question.",
    );
  });

  it("derives changes from the two latest completed scans", async () => {
    const { service, answerQuestion } = setup();
    const result = await service.ask("room-1", "What changed in this room?");

    expect(result.evidence).toHaveLength(2);
    expect(answerQuestion.mock.calls[0]?.[0].changes).toMatchObject([
      { classification: "MOVED", label: "headphones" },
    ]);
  });

  it("retrieves observations from yesterday for a temporal inventory question", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-02T18:00:00.000Z"));
    try {
      const { service } = setup();
      const result = await service.ask("room-1", "What was here yesterday?");

      expect(result.evidence.map((item) => item.observationId)).toEqual([
        "obs-1",
      ]);
    } finally {
      vi.useRealTimers();
    }
  });
});
