import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { templateDefinitions } from "@flowpilot/shared";

const filename = fileURLToPath(import.meta.url);
const apiRoot = path.resolve(path.dirname(filename), "../..");
const env = {
  ...process.env,
  DATABASE_URL: "file:../../../data/test.db",
  NODE_ENV: "test"
};

process.env.DATABASE_URL = env.DATABASE_URL;
process.env.NODE_ENV = "test";

let app: FastifyInstance;
let prisma: typeof import("../db.js").prisma;

async function resetDatabase() {
  execSync("pnpm tsx src/scripts/migrate.ts", {
    cwd: apiRoot,
    env: { ...env, FLOWPILOT_RESET_DB: "1" },
    stdio: "pipe"
  });
}

describe("FlowPilot API", () => {
  beforeAll(async () => {
    await resetDatabase();
    const dbModule = await import("../db.js");
    const appModule = await import("../app.js");
    prisma = dbModule.prisma;
    app = await appModule.buildApp({ scheduler: false });
  });

  beforeEach(async () => {
    await prisma.artifact.deleteMany();
    await prisma.runLog.deleteMany();
    await prisma.run.deleteMany();
    await prisma.automation.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates an automation and runs a CSV report with an artifact", async () => {
    const template = templateDefinitions.find((item) => item.key === "csv-report")!;
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/automations",
      payload: {
        name: "CSV Test",
        description: "Profiles sample customers",
        templateKey: template.key,
        triggerType: "manual",
        config: template.defaultConfig,
        retryLimit: 1
      }
    });

    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json();

    const runResponse = await app.inject({
      method: "POST",
      url: `/api/automations/${created.automation.id}/run`,
      payload: {}
    });

    expect(runResponse.statusCode).toBe(200);
    expect(runResponse.json().run.status).toBe("success");

    const artifactsResponse = await app.inject({
      method: "GET",
      url: "/api/artifacts"
    });

    expect(artifactsResponse.statusCode).toBe(200);
    expect(artifactsResponse.json().artifacts[0].title).toContain("CSV report");
  });

  it("toggles an automation and exposes run logs", async () => {
    const template = templateDefinitions.find((item) => item.key === "sandbox-file-organizer")!;
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/automations",
      payload: {
        name: "Organizer Test",
        templateKey: template.key,
        triggerType: "manual",
        config: template.defaultConfig,
        retryLimit: 0
      }
    });
    const automationId = createResponse.json().automation.id;

    const toggleResponse = await app.inject({
      method: "PATCH",
      url: `/api/automations/${automationId}/toggle`,
      payload: {}
    });

    expect(toggleResponse.json().automation.enabled).toBe(false);

    const runResponse = await app.inject({
      method: "POST",
      url: `/api/automations/${automationId}/run`,
      payload: {}
    });
    const runId = runResponse.json().run.id;

    const detailResponse = await app.inject({
      method: "GET",
      url: `/api/runs/${runId}`
    });

    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.json().run.status).toBe("skipped");
    expect(detailResponse.json().run.logs.length).toBeGreaterThan(0);
  });

  it("executes a webhook automation by slug", async () => {
    const template = templateDefinitions.find((item) => item.key === "webhook-event-digest")!;
    await app.inject({
      method: "POST",
      url: "/api/automations",
      payload: {
        name: "Lead Capture",
        templateKey: template.key,
        triggerType: "webhook",
        webhookSlug: "lead-capture",
        config: template.defaultConfig,
        retryLimit: 1
      }
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/webhooks/lead-capture",
      payload: {
        email: "demo@example.com",
        source: "website"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().run.status).toBe("success");
  });
});
