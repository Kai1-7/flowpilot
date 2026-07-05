import type { Prisma } from "@prisma/client";
import { TemplateKeySchema, validateTemplateConfig, type LogLevel } from "@flowpilot/shared";
import { prisma } from "../db.js";
import { errorMessage, HttpError } from "../lib/errors.js";
import { withRetries } from "../lib/retry.js";
import { createMarkdownArtifact } from "./artifacts.js";
import { executeTemplate } from "../templates/index.js";

export type RunTrigger = "manual" | "scheduled" | "webhook";

async function writeLog(
  runId: string,
  level: LogLevel,
  message: string,
  data?: Prisma.InputJsonValue
): Promise<void> {
  await prisma.runLog.create({
    data: {
      runId,
      level,
      message,
      data: data === undefined ? null : JSON.stringify(data)
    }
  });
}

export async function runAutomation(automationId: string, trigger: RunTrigger, payload?: unknown) {
  const automation = await prisma.automation.findUnique({
    where: { id: automationId }
  });

  if (!automation) {
    throw new HttpError(404, "Automation not found");
  }

  const run = await prisma.run.create({
    data: {
      automationId: automation.id,
      status: automation.enabled ? "running" : "skipped",
      trigger,
      output: automation.enabled ? null : JSON.stringify({ reason: "Automation disabled" })
    }
  });

  if (!automation.enabled) {
    await writeLog(run.id, "warn", "Run skipped because automation is disabled");
    return prisma.run.findUniqueOrThrow({
      where: { id: run.id },
      include: { automation: true, logs: true, artifacts: true }
    });
  }

  const startedAt = Date.now();
  const templateKey = TemplateKeySchema.parse(automation.templateKey);
  const config = validateTemplateConfig(templateKey, JSON.parse(automation.config));

  try {
    const result = await withRetries(
      automation.retryLimit,
      async (attempt) => {
        await prisma.run.update({
          where: { id: run.id },
          data: { attempt }
        });
        await writeLog(run.id, "info", `Starting attempt ${attempt}`, {
          templateKey,
          trigger
        });

        return executeTemplate(templateKey, config, {
          automation,
          runId: run.id,
          payload,
          log: (level, message, data) => writeLog(run.id, level, message, data),
          createArtifact: async (input) => {
            const artifactInput = {
              automationId: automation.id,
              runId: run.id,
              title: input.title,
              content: input.content,
              ...(input.fileName !== undefined ? { fileName: input.fileName } : {}),
              ...(input.metadata !== undefined ? { metadata: input.metadata } : {})
            };
            await createMarkdownArtifact(artifactInput);
          }
        });
      },
      async (attempt, error, remainingAttempts) => {
        await writeLog(run.id, "warn", `Attempt ${attempt} failed; retrying`, {
          error: errorMessage(error),
          remainingAttempts
        });
      }
    );

    await writeLog(run.id, "info", result.value.summary);

    await prisma.run.update({
      where: { id: run.id },
      data: {
        status: "success",
        durationMs: Date.now() - startedAt,
        finishedAt: new Date(),
        attempt: result.attempts,
        output: JSON.stringify(result.value.output)
      }
    });
  } catch (error) {
    await writeLog(run.id, "error", "Automation failed", {
      error: errorMessage(error)
    });

    await prisma.run.update({
      where: { id: run.id },
      data: {
        status: "failed",
        durationMs: Date.now() - startedAt,
        finishedAt: new Date(),
        error: errorMessage(error)
      }
    });
  }

  return prisma.run.findUniqueOrThrow({
    where: { id: run.id },
    include: { automation: true, logs: { orderBy: { createdAt: "asc" } }, artifacts: true }
  });
}
