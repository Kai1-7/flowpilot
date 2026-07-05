import type { WebhookDigestConfigSchema } from "@flowpilot/shared";
import type { z } from "zod";
import type { TemplateExecutor } from "./types.js";

type WebhookDigestConfig = z.infer<typeof WebhookDigestConfigSchema>;

function payloadKeys(payload: unknown): string[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
  return Object.keys(payload).slice(0, 12);
}

export const webhookDigestExecutor: TemplateExecutor<WebhookDigestConfig> = async (config, context) => {
  const keys = payloadKeys(context.payload);
  const receivedAt = new Date().toISOString();

  await context.log("info", "Webhook payload received", {
    label: config.label,
    keyCount: keys.length
  });

  const content = [
    `# ${config.label}`,
    "",
    `Received: ${receivedAt}`,
    `Automation: ${context.automation.name}`,
    "",
    "## Payload keys",
    "",
    keys.length ? keys.map((key) => `- \`${key}\``).join("\n") : "Payload was empty or not an object.",
    "",
    config.includeRawPayload ? "## Raw payload" : "",
    config.includeRawPayload ? "" : "",
    config.includeRawPayload ? "```json" : "",
    config.includeRawPayload ? JSON.stringify(context.payload ?? {}, null, 2) : "",
    config.includeRawPayload ? "```" : ""
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n");

  await context.createArtifact({
    title: `Webhook digest: ${config.label}`,
    fileName: `webhook-${Date.now()}`,
    content,
    metadata: {
      label: config.label,
      keyCount: keys.length,
      receivedAt
    }
  });

  return {
    summary: `Captured webhook payload with ${keys.length} top-level keys`,
    output: {
      receivedAt,
      keys
    }
  };
};
