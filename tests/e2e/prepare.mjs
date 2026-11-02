import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const databasePath = path.join(os.tmpdir(), "sitememory-e2e.db");
const uploadPath = path.join(os.tmpdir(), "sitememory-e2e-uploads");

await Promise.all([
  fs.rm(databasePath, { force: true }),
  fs.rm(`${databasePath}-journal`, { force: true }),
  fs.rm(`${databasePath}-shm`, { force: true }),
  fs.rm(`${databasePath}-wal`, { force: true }),
  fs.rm(uploadPath, { recursive: true, force: true }),
]);

// Prisma's SQLite migration engine expects an existing file for absolute URLs
// on some macOS temporary directories.
await fs.writeFile(databasePath, "");
