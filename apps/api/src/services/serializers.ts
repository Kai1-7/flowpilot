import type { Automation } from "@prisma/client";
import { parseSchedule } from "@flowpilot/shared";

export function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return value as T;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function serializeAutomationBase<T extends Automation>(automation: T) {
  return {
    ...automation,
    config: parseJson<Record<string, unknown>>(automation.config, {}),
    schedule: parseSchedule(automation.schedule)
  };
}

export function serializeAutomation<T extends Automation & Record<string, unknown>>(automation: T) {
  const serialized: Record<string, unknown> = serializeAutomationBase(automation);

  if (Array.isArray(automation.runs)) {
    serialized.runs = automation.runs.map((run) => serializeRun(run as Record<string, unknown>));
  }

  if (Array.isArray(automation.artifacts)) {
    serialized.artifacts = automation.artifacts.map((artifact) => serializeArtifact(artifact as Record<string, unknown>));
  }

  return serialized;
}

export function serializeRun<T extends Record<string, unknown>>(run: T) {
  const serialized: Record<string, unknown> = {
    ...run,
    output: parseJson(run.output, null)
  };

  if (run.automation && typeof run.automation === "object") {
    serialized.automation = serializeAutomationBase(run.automation as Automation);
  }

  if (Array.isArray(run.logs)) {
    serialized.logs = run.logs.map((log) => ({
      ...log,
      data: parseJson((log as Record<string, unknown>).data, null)
    }));
  }

  if (Array.isArray(run.artifacts)) {
    serialized.artifacts = run.artifacts.map((artifact) => serializeArtifact(artifact as Record<string, unknown>));
  }

  return serialized;
}

export function serializeArtifact<T extends Record<string, unknown>>(artifact: T) {
  const serialized: Record<string, unknown> = {
    ...artifact,
    metadata: parseJson(artifact.metadata, null)
  };

  if (artifact.automation && typeof artifact.automation === "object") {
    serialized.automation = serializeAutomationBase(artifact.automation as Automation);
  }

  if (artifact.run && typeof artifact.run === "object") {
    serialized.run = {
      ...(artifact.run as Record<string, unknown>),
      output: parseJson((artifact.run as Record<string, unknown>).output, null)
    };
  }

  return serialized;
}
