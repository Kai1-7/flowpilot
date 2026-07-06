import type { ScheduleConfig, TemplateDefinition, TemplateKey, TriggerType } from "@flowpilot/shared";

export type Automation = {
  id: string;
  name: string;
  description: string | null;
  templateKey: TemplateKey;
  triggerType: TriggerType;
  enabled: boolean;
  schedule: ScheduleConfig | null;
  webhookSlug: string | null;
  config: Record<string, unknown>;
  retryLimit: number;
  createdAt: string;
  updatedAt: string;
  runs?: Run[];
  artifacts?: Artifact[];
  _count?: {
    runs: number;
    artifacts: number;
  };
};

export type Run = {
  id: string;
  automationId: string;
  status: "queued" | "running" | "success" | "failed" | "skipped";
  trigger: "manual" | "scheduled" | "webhook";
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  attempt: number;
  error: string | null;
  output: unknown;
  automation?: Automation;
  logs?: RunLog[];
  artifacts?: Artifact[];
};

export type RunLog = {
  id: string;
  runId: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: unknown;
  createdAt: string;
};

export type Artifact = {
  id: string;
  automationId: string | null;
  runId: string | null;
  type: string;
  title: string;
  path: string | null;
  content: string | null;
  metadata: unknown;
  createdAt: string;
  automation?: Automation;
  run?: Run;
};

export type DashboardResponse = {
  automationCount: number;
  enabledAutomationCount: number;
  runCount: number;
  successCount: number;
  failedCount: number;
  artifactCount: number;
  templates: TemplateDefinition[];
  recentRuns: Run[];
};

export type TemplateValidationResponse = {
  ok: true;
  templateKey: TemplateKey;
  config: Record<string, unknown>;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed with HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  dashboard: () => request<DashboardResponse>("/api/dashboard"),
  templates: () => request<{ templates: TemplateDefinition[] }>("/api/templates"),
  validateTemplate: (templateKey: TemplateKey, config: Record<string, unknown>) =>
    request<TemplateValidationResponse>(`/api/templates/${templateKey}/validate`, {
      method: "POST",
      body: JSON.stringify({ config })
    }),
  automations: () => request<{ automations: Automation[] }>("/api/automations"),
  automation: (id: string) => request<{ automation: Automation }>(`/api/automations/${id}`),
  createAutomation: (body: {
    name: string;
    description?: string;
    templateKey: TemplateKey;
    triggerType: TriggerType;
    schedule?: ScheduleConfig | null;
    webhookSlug?: string | null;
    config: Record<string, unknown>;
    retryLimit?: number;
  }) =>
    request<{ automation: Automation }>("/api/automations", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  toggleAutomation: (id: string) =>
    request<{ automation: Automation }>(`/api/automations/${id}/toggle`, {
      method: "PATCH",
      body: JSON.stringify({})
    }),
  runAutomation: (id: string) =>
    request<{ run: Run }>(`/api/automations/${id}/run`, {
      method: "POST",
      body: JSON.stringify({})
    }),
  runs: () => request<{ runs: Run[] }>("/api/runs"),
  run: (id: string) => request<{ run: Run }>(`/api/runs/${id}`),
  artifacts: () => request<{ artifacts: Artifact[] }>("/api/artifacts")
};
