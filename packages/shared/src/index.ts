import { z } from "zod";

export const templateKeys = [
  "api-health-check",
  "sandbox-file-organizer",
  "csv-report",
  "webhook-event-digest"
] as const;

export const triggerTypes = ["manual", "scheduled", "webhook"] as const;
export const runStatuses = ["queued", "running", "success", "failed", "skipped"] as const;
export const logLevels = ["info", "warn", "error", "debug"] as const;

export const TemplateKeySchema = z.enum(templateKeys);
export const TriggerTypeSchema = z.enum(triggerTypes);
export const RunStatusSchema = z.enum(runStatuses);
export const LogLevelSchema = z.enum(logLevels);

export type TemplateKey = z.infer<typeof TemplateKeySchema>;
export type TriggerType = z.infer<typeof TriggerTypeSchema>;
export type RunStatus = z.infer<typeof RunStatusSchema>;
export type LogLevel = z.infer<typeof LogLevelSchema>;

export const ScheduleSchema = z
  .object({
    intervalSeconds: z.coerce.number().int().min(30).max(86_400)
  })
  .strict();

export type ScheduleConfig = z.infer<typeof ScheduleSchema>;

export const ApiHealthCheckConfigSchema = z
  .object({
    url: z.string().url(),
    method: z.enum(["GET", "HEAD"]).default("GET"),
    expectedStatus: z.coerce.number().int().min(100).max(599).default(200),
    timeoutMs: z.coerce.number().int().min(500).max(30_000).default(5000)
  })
  .strict();

export const FileOrganizerConfigSchema = z
  .object({
    sourceDir: z.string().min(1).default("inbox"),
    dryRun: z.boolean().default(true),
    rules: z
      .array(
        z
          .object({
            extensions: z.array(z.string().regex(/^\.[a-z0-9]+$/i)).min(1),
            targetDir: z.string().min(1)
          })
          .strict()
      )
      .min(1)
  })
  .strict();

export const CsvReportConfigSchema = z
  .object({
    csvPath: z.string().min(1).default("sample-customers.csv"),
    reportName: z.string().min(1).max(80).default("csv-profile-report"),
    delimiter: z.string().length(1).default(",")
  })
  .strict();

export const WebhookDigestConfigSchema = z
  .object({
    label: z.string().min(1).max(80).default("Inbound event"),
    includeRawPayload: z.boolean().default(true)
  })
  .strict();

export const templateConfigSchemas = {
  "api-health-check": ApiHealthCheckConfigSchema,
  "sandbox-file-organizer": FileOrganizerConfigSchema,
  "csv-report": CsvReportConfigSchema,
  "webhook-event-digest": WebhookDigestConfigSchema
} satisfies Record<TemplateKey, z.ZodTypeAny>;

export type TemplateConfigMap = {
  "api-health-check": z.infer<typeof ApiHealthCheckConfigSchema>;
  "sandbox-file-organizer": z.infer<typeof FileOrganizerConfigSchema>;
  "csv-report": z.infer<typeof CsvReportConfigSchema>;
  "webhook-event-digest": z.infer<typeof WebhookDigestConfigSchema>;
};

export type AnyTemplateConfig = TemplateConfigMap[TemplateKey];

export const TemplateDefinitionSchema = z
  .object({
    key: TemplateKeySchema,
    name: z.string(),
    summary: z.string(),
    category: z.string(),
    defaultTriggerType: TriggerTypeSchema,
    defaultConfig: z.record(z.unknown()),
    accent: z.string(),
    riskLevel: z.enum(["read-only", "sandbox-write", "webhook"])
  })
  .strict();

export type TemplateDefinition = z.infer<typeof TemplateDefinitionSchema>;

export const builderFieldTypes = ["text", "url", "number", "boolean", "select", "rules"] as const;
export type BuilderFieldType = (typeof builderFieldTypes)[number];

export type BuilderFieldOption = {
  label: string;
  value: string;
};

export type BuilderFieldDefinition = {
  name: string;
  label: string;
  help: string;
  type: BuilderFieldType;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: BuilderFieldOption[];
};

export type TemplateBuilderDefinition = {
  templateKey: TemplateKey;
  recommendedName: string;
  configFields: BuilderFieldDefinition[];
  successHint: string;
};

export const templateDefinitions: TemplateDefinition[] = [
  {
    key: "api-health-check",
    name: "API Health Check",
    summary: "Checks a URL, records latency, and flags unexpected status codes.",
    category: "Monitoring",
    defaultTriggerType: "scheduled",
    defaultConfig: {
      url: "http://localhost:4357/api/health",
      method: "GET",
      expectedStatus: 200,
      timeoutMs: 5000
    },
    accent: "cyan",
    riskLevel: "read-only"
  },
  {
    key: "sandbox-file-organizer",
    name: "Sandbox File Organizer",
    summary: "Plans or moves demo files into folders by extension inside the sandbox.",
    category: "Files",
    defaultTriggerType: "manual",
    defaultConfig: {
      sourceDir: "inbox",
      dryRun: true,
      rules: [
        { extensions: [".pdf", ".docx"], targetDir: "documents" },
        { extensions: [".csv", ".xlsx"], targetDir: "spreadsheets" },
        { extensions: [".png", ".jpg"], targetDir: "images" },
        { extensions: [".log", ".txt"], targetDir: "notes" }
      ]
    },
    accent: "amber",
    riskLevel: "sandbox-write"
  },
  {
    key: "csv-report",
    name: "CSV Insight Report",
    summary: "Profiles a CSV file and writes a Markdown data-quality artifact.",
    category: "Reporting",
    defaultTriggerType: "manual",
    defaultConfig: {
      csvPath: "sample-customers.csv",
      reportName: "customer-csv-profile",
      delimiter: ","
    },
    accent: "emerald",
    riskLevel: "read-only"
  },
  {
    key: "webhook-event-digest",
    name: "Webhook Event Digest",
    summary: "Receives JSON payloads and stores a readable event summary artifact.",
    category: "Webhooks",
    defaultTriggerType: "webhook",
    defaultConfig: {
      label: "Inbound lead",
      includeRawPayload: true
    },
    accent: "violet",
    riskLevel: "webhook"
  }
];

export const templateBuilderDefinitions = {
  "api-health-check": {
    templateKey: "api-health-check",
    recommendedName: "Local API Pulse",
    successHint: "Use this when you need a scheduled monitor with latency and status evidence.",
    configFields: [
      {
        name: "url",
        label: "URL",
        help: "Endpoint to check. It must include http:// or https://.",
        type: "url",
        placeholder: "http://localhost:4357/api/health"
      },
      {
        name: "method",
        label: "Method",
        help: "GET reads the endpoint body; HEAD only checks headers.",
        type: "select",
        options: [
          { label: "GET", value: "GET" },
          { label: "HEAD", value: "HEAD" }
        ]
      },
      {
        name: "expectedStatus",
        label: "Expected status",
        help: "The HTTP status code that marks the run successful.",
        type: "number",
        min: 100,
        max: 599,
        step: 1
      },
      {
        name: "timeoutMs",
        label: "Timeout",
        help: "Maximum wait time in milliseconds before failing the check.",
        type: "number",
        min: 500,
        max: 30_000,
        step: 500
      }
    ]
  },
  "sandbox-file-organizer": {
    templateKey: "sandbox-file-organizer",
    recommendedName: "Inbox Organizer Preview",
    successHint: "Use dry-run first so file changes stay reviewable before enabling writes.",
    configFields: [
      {
        name: "sourceDir",
        label: "Source folder",
        help: "Folder inside data/sandbox to scan.",
        type: "text",
        placeholder: "inbox"
      },
      {
        name: "dryRun",
        label: "Dry run",
        help: "When enabled, FlowPilot writes a plan without moving files.",
        type: "boolean"
      },
      {
        name: "rules",
        label: "Rules",
        help: "Extension groups mapped to target folders inside the sandbox.",
        type: "rules"
      }
    ]
  },
  "csv-report": {
    templateKey: "csv-report",
    recommendedName: "Customer CSV Insight",
    successHint: "Use this to create a lightweight data-quality artifact from a local CSV.",
    configFields: [
      {
        name: "csvPath",
        label: "CSV path",
        help: "CSV file inside data/sandbox.",
        type: "text",
        placeholder: "sample-customers.csv"
      },
      {
        name: "reportName",
        label: "Report name",
        help: "Used for the Markdown artifact title and filename.",
        type: "text",
        placeholder: "customer-csv-profile"
      },
      {
        name: "delimiter",
        label: "Delimiter",
        help: "Single character delimiter used by the CSV parser.",
        type: "text",
        placeholder: ","
      }
    ]
  },
  "webhook-event-digest": {
    templateKey: "webhook-event-digest",
    recommendedName: "Inbound Lead Digest",
    successHint: "Use this to turn incoming JSON payloads into searchable Markdown evidence.",
    configFields: [
      {
        name: "label",
        label: "Label",
        help: "Readable label used as the artifact title.",
        type: "text",
        placeholder: "Inbound lead"
      },
      {
        name: "includeRawPayload",
        label: "Include raw payload",
        help: "Store the raw JSON payload in the generated artifact.",
        type: "boolean"
      }
    ]
  }
} satisfies Record<TemplateKey, TemplateBuilderDefinition>;

export function getTemplateDefinition(templateKey: TemplateKey): TemplateDefinition {
  const definition = templateDefinitions.find((template) => template.key === templateKey);
  if (!definition) throw new Error(`Unknown template: ${templateKey}`);
  return definition;
}

export function getTemplateBuilderDefinition(templateKey: TemplateKey): TemplateBuilderDefinition {
  return templateBuilderDefinitions[templateKey];
}

export const AutomationCreateSchema = z
  .object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional().nullable(),
    templateKey: TemplateKeySchema,
    triggerType: TriggerTypeSchema.default("manual"),
    enabled: z.boolean().default(true),
    schedule: ScheduleSchema.optional().nullable(),
    webhookSlug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .min(3)
      .max(80)
      .optional()
      .nullable(),
    config: z.record(z.unknown()),
    retryLimit: z.coerce.number().int().min(0).max(3).default(1)
  })
  .strict();

export const AutomationPatchSchema = AutomationCreateSchema.partial().extend({
  enabled: z.boolean().optional()
});

export type AutomationCreateInput = z.infer<typeof AutomationCreateSchema>;
export type AutomationPatchInput = z.infer<typeof AutomationPatchSchema>;

export const RunFilterSchema = z
  .object({
    status: RunStatusSchema.optional(),
    trigger: TriggerTypeSchema.optional(),
    automationId: z.string().min(1).optional(),
    q: z.string().trim().min(1).max(100).optional()
  })
  .strict();

export const ArtifactFilterSchema = z
  .object({
    type: z.string().trim().min(1).max(50).optional(),
    automationId: z.string().min(1).optional(),
    q: z.string().trim().min(1).max(100).optional()
  })
  .strict();

export type RunFilterInput = z.infer<typeof RunFilterSchema>;
export type ArtifactFilterInput = z.infer<typeof ArtifactFilterSchema>;

export type StatusCount = {
  status: RunStatus;
  count: number;
};

export type TriggerCount = {
  trigger: TriggerType;
  count: number;
};

export type DashboardHealthSummary = {
  successRate: number;
  averageDurationMs: number | null;
  lastRunAt: string | null;
  statusCounts: StatusCount[];
  triggerCounts: TriggerCount[];
};

export function validateTemplateConfig(templateKey: TemplateKey, config: unknown): AnyTemplateConfig {
  return templateConfigSchemas[templateKey].parse(config) as AnyTemplateConfig;
}

export function parseSchedule(value: string | null | undefined): ScheduleConfig | null {
  if (!value) return null;
  return ScheduleSchema.parse(JSON.parse(value));
}

export function stringifySchedule(value: ScheduleConfig | null | undefined): string | null {
  return value ? JSON.stringify(value) : null;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}
