import { afterEach, describe, expect, it, vi } from "vitest";
import { MetaVisionProvider } from "./meta-vision-provider.js";

const outputText =
  "<0f>0<|box;x1=211;y1=228;x2=270;y2=254;w=320;h=334;c=0.75|>" +
  "<|mask;x=0;y=0;c=0.75;data=27,60,~!!!!M!0c[0o91w?q1!pIH4pPRVp2B3'7`e.ioeAf6-k/#Xd8%dX9x(|>\n";

describe("MetaVisionProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("builds the official image request and normalizes parsed SAM output", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "completed",
          output: [
            {
              id: "message-1",
              content: [{ type: "output_text", text: outputText }],
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const provider = new MetaVisionProvider({
      apiKey: "test-key",
      baseUrl: "https://api.meta.ai/v1",
      model: "sam-3.1",
      timeoutMs: 5_000,
    });

    const result = await provider.segmentImage({
      bytes: Buffer.from("image"),
      mimeType: "image/jpeg",
      width: 320,
      height: 334,
      prompts: ["headphones"],
    });

    expect(result.provider).toBe("meta");
    expect(result.objects).toHaveLength(1);
    expect(result.objects[0]).toMatchObject({
      label: "headphones",
      confidence: 0.75,
    });
    expect(result.objects[0]?.boundingBox.x).toBeCloseTo(211 / 320);
    expect(result.objects[0]?.mask?.path).toContain("M");

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.meta.ai/v1/responses");
    expect(init.headers).toMatchObject({ Authorization: "Bearer test-key" });
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: "sam-3.1",
      stream: false,
      metadata: { include_confidence: "true" },
    });
  });
});
