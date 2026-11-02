import type { ReasoningInput, ReasoningProvider } from "./types.js";

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_RETRIES = 2;

interface MetaReasoningConfig {
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

async function readBoundedJson(response: Response) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new Error("The Meta reasoning response exceeded its size limit.");
  }
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) {
    throw new Error("The Meta reasoning response exceeded its size limit.");
  }
  return JSON.parse(text) as unknown;
}

function outputText(bodyValue: unknown) {
  const body = asRecord(bodyValue);
  if (!body || body.status !== "completed" || !Array.isArray(body.output)) {
    throw new Error("Muse did not return a completed response.");
  }
  const parts: string[] = [];
  for (const itemValue of body.output) {
    const item = asRecord(itemValue);
    if (!item || item.type !== "message" || !Array.isArray(item.content))
      continue;
    for (const contentValue of item.content) {
      const content = asRecord(contentValue);
      if (content?.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }
  const answer = parts.join("\n").trim();
  if (!answer) throw new Error("Muse returned an empty answer.");
  return answer;
}

export class MetaReasoningProvider implements ReasoningProvider {
  readonly name = "meta" as const;

  constructor(private readonly config: MetaReasoningConfig) {}

  async answerQuestion(input: ReasoningInput) {
    const endpoint = new URL(
      "responses",
      `${this.config.baseUrl.replace(/\/$/, "")}/`,
    );
    const payload = {
      model: this.config.model,
      store: false,
      max_output_tokens: 800,
      reasoning: { effort: "low" },
      instructions:
        "You are SiteMemory, an evidence-grounded spatial memory assistant. Answer only from the supplied structured evidence. Never invent a location, object, time, scan, or change. Treat 'no longer visible' as a detection result, not proof that an object was removed. If evidence is missing or ambiguous, say so plainly. Keep the answer concise and do not include raw database IDs; the application attaches evidence links separately.",
      input: JSON.stringify({
        room: input.roomName,
        question: input.question,
        evidence: input.evidence,
        recentChanges: input.changes,
      }),
    };

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
      if (response.ok) {
        const rawResponse = await readBoundedJson(response);
        return {
          provider: this.name,
          answer: outputText(rawResponse),
          rawResponse,
        };
      }
      const transient = response.status === 429 || response.status >= 500;
      if (!transient || attempt === MAX_RETRIES) {
        throw new Error(
          `Meta Muse request failed with status ${response.status}.`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
    throw new Error("Meta Muse request failed.");
  }
}
