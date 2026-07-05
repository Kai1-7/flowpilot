import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { templateDefinitions, stringifySchedule } from "@flowpilot/shared";
import { sandboxDir } from "./config.js";
import { prisma } from "./db.js";

async function ensureSampleSandbox() {
  await mkdir(path.join(sandboxDir, "inbox"), { recursive: true });

  const files = new Map<string, string>([
    [
      "sample-customers.csv",
      [
        "customer_id,name,plan,region,mrr,last_seen,risk_score",
        "1001,Aurora Labs,Scale,North America,2400,2026-07-01,0.14",
        "1002,Beacon Legal,Team,Latin America,880,2026-06-26,0.31",
        "1003,Cypress Studio,Starter,Europe,120,2026-06-12,0.62",
        "1004,Delta Ops,Scale,North America,3100,2026-07-03,0.08"
      ].join("\n")
    ],
    ["inbox/q2-invoice.pdf", "Demo placeholder PDF-like file for FlowPilot sandbox organization."],
    ["inbox/customer-export.csv", "id,name,status\n1,Aurora Labs,active\n2,Beacon Legal,active"],
    ["inbox/system.log", "2026-07-04T18:00:00Z INFO demo service started"],
    ["inbox/diagram.png", "Demo placeholder image file for FlowPilot sandbox organization."],
    ["inbox/todo.txt", "Review automation run logs\nPrepare GitHub screenshots"]
  ]);

  for (const [relativePath, content] of files) {
    const target = path.join(sandboxDir, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  }
}

async function main() {
  await ensureSampleSandbox();
  await prisma.artifact.deleteMany();
  await prisma.runLog.deleteMany();
  await prisma.run.deleteMany();
  await prisma.automation.deleteMany();

  const byKey = Object.fromEntries(templateDefinitions.map((template) => [template.key, template]));

  await prisma.automation.createMany({
    data: [
      {
        name: "Local API Pulse",
        description: "Scheduled health check against the FlowPilot API itself.",
        templateKey: "api-health-check",
        triggerType: "scheduled",
        enabled: true,
        schedule: stringifySchedule({ intervalSeconds: 300 }),
        config: JSON.stringify(byKey["api-health-check"]!.defaultConfig),
        retryLimit: 2
      },
      {
        name: "Inbox Organizer Preview",
        description: "Dry-run organizer for files inside data/sandbox/inbox.",
        templateKey: "sandbox-file-organizer",
        triggerType: "manual",
        enabled: true,
        schedule: null,
        config: JSON.stringify(byKey["sandbox-file-organizer"]!.defaultConfig),
        retryLimit: 0
      },
      {
        name: "Customer CSV Insight",
        description: "Profiles sample customer data and generates a Markdown artifact.",
        templateKey: "csv-report",
        triggerType: "manual",
        enabled: true,
        schedule: null,
        config: JSON.stringify(byKey["csv-report"]!.defaultConfig),
        retryLimit: 1
      },
      {
        name: "Inbound Lead Digest",
        description: "Webhook endpoint for demo lead payloads.",
        templateKey: "webhook-event-digest",
        triggerType: "webhook",
        enabled: true,
        schedule: null,
        webhookSlug: "lead-intake",
        config: JSON.stringify(byKey["webhook-event-digest"]!.defaultConfig),
        retryLimit: 1
      }
    ]
  });

  console.log("Seeded FlowPilot demo automations and sandbox data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
