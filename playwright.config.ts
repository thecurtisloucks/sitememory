import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const databasePath = path.join(os.tmpdir(), "sitememory-e2e.db");
const uploadPath = path.join(os.tmpdir(), "sitememory-e2e-uploads");

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "line",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command:
        "node tests/e2e/prepare.mjs && npm run db:deploy && npm run build -w @sitememory/shared && npm run dev -w @sitememory/api",
      url: "http://127.0.0.1:3101/api/health",
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        DATABASE_URL: `file:${databasePath}`,
        UPLOAD_DIR: uploadPath,
        API_HOST: "127.0.0.1",
        API_PORT: "3101",
        WEB_ORIGIN: "http://127.0.0.1:4173",
        VISION_PROVIDER: "mock",
        REASONING_PROVIDER: "mock",
      },
    },
    {
      command: "npm run dev -w @sitememory/web -- --host 127.0.0.1 --port 4173",
      url: "http://127.0.0.1:4173",
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        VITE_API_URL: "http://127.0.0.1:3101",
      },
    },
  ],
});
