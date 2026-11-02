import { afterEach, describe, expect, it, vi } from "vitest";
import { MetaReasoningProvider } from "./meta-reasoning-provider.js";

describe("MetaReasoningProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends grounded context to Muse and extracts output text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "completed",
          output: [
            {
              type: "message",
              content: [{ type: "output_text", text: "On the left." }],
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const provider = new MetaReasoningProvider({
      apiKey: "test-key",
      baseUrl: "https://api.meta.ai/v1",
      model: "muse-spark-1.3",
      timeoutMs: 5_000,
    });

    const result = await provider.answerQuestion({
      roomName: "Office",
      question: "Where are my headphones?",
      changes: [],
      evidence: [
        {
          observationId: "observation-1",
          scanId: "scan-1",
          trackedObjectId: "object-1",
          label: "headphones",
          description: "Black headphones",
          capturedAt: "2026-11-02T12:00:00.000Z",
          imageUrl: "/api/scans/scan-1/image",
          boundingBox: { x: 0.1, y: 0.2, width: 0.2, height: 0.2 },
        },
      ],
    });

    expect(result).toMatchObject({ provider: "meta", answer: "On the left." });
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.meta.ai/v1/responses");
    expect(init.headers).toMatchObject({ Authorization: "Bearer test-key" });
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      model: "muse-spark-1.3",
      store: false,
      reasoning: { effort: "low" },
    });
    expect(body.input).toContain("observation-1");
  });
});
