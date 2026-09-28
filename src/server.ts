import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = buildApp({ config });

try {
  await app.listen({ port: config.port, host: config.host });
  console.info(
    JSON.stringify({
      event: "server_started",
      port: config.port,
      host: config.host,
    }),
  );
} catch {
  process.exitCode = 1;
}
