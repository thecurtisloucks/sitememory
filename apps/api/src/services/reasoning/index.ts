import { env } from "../../lib/env.js";
import { MetaReasoningProvider } from "./meta-reasoning-provider.js";
import { MockReasoningProvider } from "./mock-reasoning-provider.js";
import type { ReasoningProvider } from "./types.js";

export function createReasoningProvider(): ReasoningProvider {
  if (env.REASONING_PROVIDER === "mock") return new MockReasoningProvider();
  if (!env.META_API_KEY) {
    throw new Error("META_API_KEY is required when REASONING_PROVIDER=meta.");
  }
  return new MetaReasoningProvider({
    apiKey: env.META_API_KEY,
    baseUrl: env.META_API_BASE_URL,
    model: env.META_MUSE_MODEL,
    timeoutMs: env.META_REQUEST_TIMEOUT_MS,
  });
}

export type { ReasoningProvider } from "./types.js";
