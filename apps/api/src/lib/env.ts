import "dotenv/config";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";

const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));

const envSchema = z.object({
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  SERVE_WEB: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  WEB_DIST_DIR: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || path.join(repositoryRoot, "apps/web/dist")),
  UPLOAD_DIR: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || path.join(repositoryRoot, "uploads")),
  MAX_UPLOAD_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(10 * 1024 * 1024),
  VISION_PROVIDER: z.enum(["mock", "meta"]).default("mock"),
  REASONING_PROVIDER: z.enum(["mock", "meta"]).default("mock"),
  META_API_KEY: z.string().trim().optional(),
  META_API_BASE_URL: z.string().url().default("https://api.meta.ai/v1"),
  META_SAM_MODEL: z.string().trim().default("sam-3.1"),
  META_MUSE_MODEL: z.string().trim().default("muse-spark-1.3"),
  META_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
});

export const env = envSchema.parse(process.env);
