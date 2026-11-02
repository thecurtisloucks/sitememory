import {
  decodeMaskToSVGPath,
  parseImageStream,
  recordsOfKind,
  type ResponsesEvent,
  type SegmentationMaskRecord,
} from "@meta-sam/parser";
import type {
  SegmentationObject,
  SegmentImageInput,
  VisionProvider,
} from "./types.js";

const MAX_RESPONSE_BYTES = 16 * 1024 * 1024;
const MAX_RETRIES = 2;

interface MetaVisionConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null
    ? (value as JsonRecord)
    : null;
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

async function readBoundedJson(response: Response): Promise<unknown> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new Error("The Meta segmentation response exceeded its size limit.");
  }
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) {
    throw new Error("The Meta segmentation response exceeded its size limit.");
  }
  return JSON.parse(text) as unknown;
}

async function* responseEvents(
  bodyValue: unknown,
): AsyncIterable<ResponsesEvent> {
  const body = asRecord(bodyValue);
  if (!body) throw new Error("Meta returned an invalid segmentation response.");

  const output = Array.isArray(body.output) ? body.output : [];
  let contentIndex = 0;
  for (let outputIndex = 0; outputIndex < output.length; outputIndex += 1) {
    const item = asRecord(output[outputIndex]);
    if (!item || !Array.isArray(item.content)) continue;
    const itemId = typeof item.id === "string" ? item.id : "sam-image";
    for (const content of item.content) {
      const part = asRecord(content);
      if (
        !part ||
        part.type !== "output_text" ||
        typeof part.text !== "string"
      ) {
        continue;
      }
      const lane = {
        item_id: itemId,
        output_index: outputIndex,
        content_index: contentIndex,
      };
      yield { type: "response.output_text.delta", delta: part.text, ...lane };
      yield { type: "response.output_text.done", text: part.text, ...lane };
      contentIndex += 1;
    }
  }

  if (body.status === "completed") {
    yield { type: "response.completed" };
    return;
  }
  if (body.status === "incomplete") {
    yield {
      type: "response.incomplete",
      response: { incomplete_details: body.incomplete_details ?? null },
    };
    return;
  }
  const upstreamError = asRecord(body.error);
  yield {
    type: "response.failed",
    response: {
      error: {
        message:
          typeof upstreamError?.message === "string"
            ? upstreamError.message
            : "Meta SAM 3.1 reported a failed response.",
      },
    },
  };
}

function maskForObject(
  masks: readonly SegmentationMaskRecord[],
  objectId: string,
) {
  return masks.find((mask) => mask.objectId === objectId);
}

export class MetaVisionProvider implements VisionProvider {
  readonly name = "meta" as const;

  constructor(private readonly config: MetaVisionConfig) {}

  async segmentImage(input: SegmentImageInput) {
    const objects: SegmentationObject[] = [];
    const rawResponses: unknown[] = [];

    for (const prompt of input.prompts) {
      const body = await this.requestPrompt(input, prompt);
      const result = await parseImageStream(responseEvents(body)).finalResult;
      if (result.outcome.status !== "completed") {
        throw new Error(`SAM 3.1 did not complete the ${prompt} segmentation.`);
      }

      const boxes = recordsOfKind(result.records, "box");
      const masks = recordsOfKind(result.records, "mask");
      for (const box of boxes) {
        const maskRecord = maskForObject(masks, box.objectId);
        const x = clamp(box.left / input.width);
        const y = clamp(box.top / input.height);
        const right = clamp(box.right / input.width);
        const bottom = clamp(box.bottom / input.height);
        if (right <= x || bottom <= y) continue;

        objects.push({
          label: prompt,
          description: `${prompt} segmented by Meta SAM 3.1`,
          boundingBox: { x, y, width: right - x, height: bottom - y },
          mask: maskRecord
            ? {
                kind: "svg-path",
                path: decodeMaskToSVGPath(maskRecord.mask),
                width: maskRecord.mask.width,
                height: maskRecord.mask.height,
              }
            : null,
          confidence: box.confidence ?? maskRecord?.confidence,
        });
      }
      rawResponses.push({
        prompt,
        rawOutput: result.rawOutput,
        diagnostics: result.diagnostics,
      });
    }

    return { provider: this.name, objects, rawResponse: rawResponses };
  }

  private async requestPrompt(input: SegmentImageInput, prompt: string) {
    const endpoint = new URL(
      "responses",
      `${this.config.baseUrl.replace(/\/$/, "")}/`,
    );
    const body = JSON.stringify({
      model: this.config.model,
      stream: false,
      input: [
        {
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            {
              type: "input_image",
              image_url: `data:${input.mimeType};base64,${input.bytes.toString("base64")}`,
            },
          ],
        },
      ],
      metadata: { include_confidence: "true" },
    });

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body,
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (response.ok) return readBoundedJson(response);
      const transient = response.status === 429 || response.status >= 500;
      if (!transient || attempt === MAX_RETRIES) {
        throw new Error(
          `Meta SAM 3.1 request failed with status ${response.status}.`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
    throw new Error("Meta SAM 3.1 request failed.");
  }
}
