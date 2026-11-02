import { env } from "../../lib/env.js";
import { MockVisionProvider } from "./mock-vision-provider.js";
import { MetaVisionProvider } from "./meta-vision-provider.js";
import type { VisionProvider } from "./types.js";

export const DEFAULT_OBJECT_PROMPTS = [
  "headphones",
  "coffee mug",
  "notebook",
  "keyboard",
] as const;

export function createVisionProvider(): VisionProvider {
  if (env.VISION_PROVIDER === "mock") return new MockVisionProvider();
  if (!env.META_API_KEY) {
    throw new Error("META_API_KEY is required when VISION_PROVIDER=meta.");
  }
  return new MetaVisionProvider({
    apiKey: env.META_API_KEY,
    baseUrl: env.META_API_BASE_URL,
    model: env.META_SAM_MODEL,
    timeoutMs: env.META_REQUEST_TIMEOUT_MS,
  });
}

export type { VisionProvider } from "./types.js";
