import { buildApp } from "./app.js";
import { env } from "./lib/env.js";

const app = await buildApp({ logger: true });

try {
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
