import type { ApiHealthCheckConfigSchema } from "@flowpilot/shared";
import type { z } from "zod";
import type { TemplateExecutor } from "./types.js";

type ApiHealthCheckConfig = z.infer<typeof ApiHealthCheckConfigSchema>;

export const apiHealthCheckExecutor: TemplateExecutor<ApiHealthCheckConfig> = async (config, context) => {
  const controller = new AbortController();
  const startedAt = performance.now();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  await context.log("info", "Checking API endpoint", {
    url: config.url,
    method: config.method,
    expectedStatus: config.expectedStatus
  });

  try {
    const response = await fetch(config.url, {
      method: config.method,
      signal: controller.signal
    });
    const durationMs = Math.round(performance.now() - startedAt);

    await context.log("info", "Endpoint responded", {
      status: response.status,
      durationMs
    });

    if (response.status !== config.expectedStatus) {
      throw new Error(`Expected HTTP ${config.expectedStatus}, received HTTP ${response.status}`);
    }

    return {
      summary: `Endpoint healthy in ${durationMs}ms`,
      output: {
        url: config.url,
        status: response.status,
        durationMs,
        ok: true
      }
    };
  } finally {
    clearTimeout(timeout);
  }
};
