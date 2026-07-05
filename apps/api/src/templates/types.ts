import type { Automation, Prisma } from "@prisma/client";
import type { LogLevel } from "@flowpilot/shared";

export type TemplateResult = {
  summary: string;
  output: Prisma.InputJsonValue;
};

export type TemplateContext = {
  automation: Automation;
  runId: string;
  payload?: unknown;
  log: (level: LogLevel, message: string, data?: Prisma.InputJsonValue) => Promise<void>;
  createArtifact: (input: {
    title: string;
    fileName?: string;
    content: string;
    metadata?: Prisma.InputJsonValue;
  }) => Promise<void>;
};

export type TemplateExecutor<TConfig> = (config: TConfig, context: TemplateContext) => Promise<TemplateResult>;
