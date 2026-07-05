import cors from "@fastify/cors";
import Fastify from "fastify";
import {
  AutomationCreateSchema,
  AutomationPatchSchema,
  TemplateKeySchema,
  TriggerTypeSchema,
  parseSchedule,
  slugify,
  stringifySchedule,
  templateDefinitions,
  validateTemplateConfig
} from "@flowpilot/shared";
import type { Prisma } from "@prisma/client";
import { appInfo } from "./config.js";
import { prisma } from "./db.js";
import { errorMessage, HttpError } from "./lib/errors.js";
import { serializeArtifact, serializeAutomation, serializeRun } from "./services/serializers.js";
import { runAutomation } from "./services/runner.js";
import { startScheduler } from "./services/scheduler.js";

type BuildAppOptions = {
  scheduler?: boolean;
};

async function uniqueWebhookSlug(preferred: string): Promise<string> {
  const base = slugify(preferred) || "webhook";
  let candidate = base;
  let index = 2;

  while (await prisma.automation.findUnique({ where: { webhookSlug: candidate } })) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "warn"
    }
  });

  await app.register(cors, {
    origin: true
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({
        error: error.message,
        details: error.details
      });
    }

    if (typeof error === "object" && error !== null && "validation" in error) {
      return reply.status(400).send({
        error: "Request validation failed",
        details: error.validation
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: errorMessage(error)
    });
  });

  app.get("/api/health", async () => ({
    status: "ok",
    app: appInfo.name,
    version: appInfo.version,
    time: new Date().toISOString()
  }));

  app.get("/api/dashboard", async () => {
    const [automationCount, enabledAutomationCount, runCount, successCount, failedCount, artifactCount, recentRuns] =
      await prisma.$transaction([
        prisma.automation.count(),
        prisma.automation.count({ where: { enabled: true } }),
        prisma.run.count(),
        prisma.run.count({ where: { status: "success" } }),
        prisma.run.count({ where: { status: "failed" } }),
        prisma.artifact.count(),
        prisma.run.findMany({
          take: 6,
          orderBy: { startedAt: "desc" },
          include: { automation: true, artifacts: true }
        })
      ]);

    return {
      automationCount,
      enabledAutomationCount,
      runCount,
      successCount,
      failedCount,
      artifactCount,
      templates: templateDefinitions,
      recentRuns: recentRuns.map((run) => serializeRun(run))
    };
  });

  app.get("/api/templates", async () => ({
    templates: templateDefinitions
  }));

  app.get("/api/automations", async () => {
    const automations = await prisma.automation.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { runs: true, artifacts: true } },
        runs: { take: 1, orderBy: { startedAt: "desc" } }
      }
    });

    return {
      automations: automations.map((automation) => serializeAutomation(automation))
    };
  });

  app.post("/api/automations", async (request, reply) => {
    const parsed = AutomationCreateSchema.parse(request.body);
    const config = validateTemplateConfig(parsed.templateKey, parsed.config);
    const triggerType = parsed.triggerType;
    const webhookSlug =
      triggerType === "webhook" ? await uniqueWebhookSlug(parsed.webhookSlug ?? parsed.name) : null;
    const schedule =
      triggerType === "scheduled"
        ? stringifySchedule(parsed.schedule ?? { intervalSeconds: 300 })
        : null;

    const automation = await prisma.automation.create({
      data: {
        name: parsed.name,
        description: parsed.description ?? null,
        templateKey: parsed.templateKey,
        triggerType,
        enabled: parsed.enabled,
        schedule,
        webhookSlug,
        config: JSON.stringify(config),
        retryLimit: parsed.retryLimit
      }
    });

    return reply.status(201).send({
      automation: serializeAutomation(automation)
    });
  });

  app.get<{ Params: { id: string } }>("/api/automations/:id", async (request) => {
    const automation = await prisma.automation.findUnique({
      where: { id: request.params.id },
      include: {
        runs: {
          take: 10,
          orderBy: { startedAt: "desc" },
          include: { artifacts: true }
        },
        artifacts: {
          take: 10,
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!automation) throw new HttpError(404, "Automation not found");

    return {
      automation: serializeAutomation(automation)
    };
  });

  app.patch<{ Params: { id: string } }>("/api/automations/:id", async (request) => {
    const current = await prisma.automation.findUnique({
      where: { id: request.params.id }
    });
    if (!current) throw new HttpError(404, "Automation not found");

    const parsed = AutomationPatchSchema.parse(request.body);
    const nextTemplateKey = TemplateKeySchema.parse(parsed.templateKey ?? current.templateKey);
    const nextTriggerType = TriggerTypeSchema.parse(parsed.triggerType ?? current.triggerType);
    const nextConfig = parsed.config
      ? validateTemplateConfig(nextTemplateKey, parsed.config)
      : JSON.parse(current.config);
    const updateData: Prisma.AutomationUncheckedUpdateInput = {
      config: JSON.stringify(nextConfig),
      schedule:
        nextTriggerType === "scheduled"
          ? stringifySchedule(parsed.schedule ?? parseSchedule(current.schedule) ?? { intervalSeconds: 300 })
          : null,
      webhookSlug:
        nextTriggerType === "webhook"
          ? parsed.webhookSlug ?? current.webhookSlug ?? (await uniqueWebhookSlug(parsed.name ?? current.name))
          : null
    };

    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.templateKey !== undefined) updateData.templateKey = parsed.templateKey;
    if (parsed.triggerType !== undefined) updateData.triggerType = parsed.triggerType;
    if (parsed.enabled !== undefined) updateData.enabled = parsed.enabled;
    if (parsed.retryLimit !== undefined) updateData.retryLimit = parsed.retryLimit;

    const automation = await prisma.automation.update({
      where: { id: current.id },
      data: updateData
    });

    return {
      automation: serializeAutomation(automation)
    };
  });

  app.delete<{ Params: { id: string } }>("/api/automations/:id", async (request, reply) => {
    await prisma.automation.delete({
      where: { id: request.params.id }
    });

    return reply.status(204).send();
  });

  app.post<{ Params: { id: string } }>("/api/automations/:id/run", async (request) => {
    const run = await runAutomation(request.params.id, "manual", request.body);
    return { run: serializeRun(run) };
  });

  app.patch<{ Params: { id: string } }>("/api/automations/:id/toggle", async (request) => {
    const current = await prisma.automation.findUnique({
      where: { id: request.params.id }
    });
    if (!current) throw new HttpError(404, "Automation not found");

    const automation = await prisma.automation.update({
      where: { id: current.id },
      data: { enabled: !current.enabled }
    });

    return {
      automation: serializeAutomation(automation)
    };
  });

  app.get("/api/runs", async () => {
    const runs = await prisma.run.findMany({
      take: 50,
      orderBy: { startedAt: "desc" },
      include: { automation: true, artifacts: true }
    });

    return { runs: runs.map((run) => serializeRun(run)) };
  });

  app.get<{ Params: { id: string } }>("/api/runs/:id", async (request) => {
    const run = await prisma.run.findUnique({
      where: { id: request.params.id },
      include: {
        automation: true,
        logs: { orderBy: { createdAt: "asc" } },
        artifacts: true
      }
    });

    if (!run) throw new HttpError(404, "Run not found");

    return { run: serializeRun(run) };
  });

  app.get("/api/artifacts", async () => {
    const artifacts = await prisma.artifact.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        automation: true,
        run: true
      }
    });

    return { artifacts: artifacts.map((artifact) => serializeArtifact(artifact)) };
  });

  app.post<{ Params: { slug: string } }>("/api/webhooks/:slug", async (request) => {
    const automation = await prisma.automation.findFirst({
      where: {
        webhookSlug: request.params.slug,
        triggerType: "webhook"
      }
    });

    if (!automation) throw new HttpError(404, "Webhook automation not found");

    const run = await runAutomation(automation.id, "webhook", request.body);
    return { run: serializeRun(run) };
  });

  let stopScheduler: (() => void) | undefined;
  if (options.scheduler ?? true) {
    stopScheduler = startScheduler();
  }

  app.addHook("onClose", async () => {
    stopScheduler?.();
    await prisma.$disconnect();
  });

  return app;
}
