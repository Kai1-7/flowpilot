import { apiPort } from "./config.js";
import { buildApp } from "./app.js";

const app = await buildApp({ scheduler: true });

try {
  await app.listen({
    port: apiPort,
    host: "0.0.0.0"
  });
  app.log.info(`FlowPilot API listening on http://localhost:${apiPort}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void app.close().finally(() => process.exit(0));
  });
}
