import {
  ApiHealthCheckConfigSchema,
  CsvReportConfigSchema,
  FileOrganizerConfigSchema,
  type TemplateKey,
  WebhookDigestConfigSchema
} from "@flowpilot/shared";
import { apiHealthCheckExecutor } from "./apiHealthCheck.js";
import { csvReportExecutor } from "./csvReport.js";
import { fileOrganizerExecutor } from "./fileOrganizer.js";
import type { TemplateContext, TemplateResult } from "./types.js";
import { webhookDigestExecutor } from "./webhookDigest.js";

export async function executeTemplate(
  templateKey: TemplateKey,
  config: unknown,
  context: TemplateContext
): Promise<TemplateResult> {
  switch (templateKey) {
    case "api-health-check":
      return apiHealthCheckExecutor(ApiHealthCheckConfigSchema.parse(config), context);
    case "sandbox-file-organizer":
      return fileOrganizerExecutor(FileOrganizerConfigSchema.parse(config), context);
    case "csv-report":
      return csvReportExecutor(CsvReportConfigSchema.parse(config), context);
    case "webhook-event-digest":
      return webhookDigestExecutor(WebhookDigestConfigSchema.parse(config), context);
  }
}
