import { parseSchedule } from "@flowpilot/shared";
import { prisma } from "../db.js";
import { runAutomation } from "./runner.js";

const inFlight = new Set<string>();
let timer: NodeJS.Timeout | undefined;

async function shouldRun(automationId: string, intervalSeconds: number): Promise<boolean> {
  const latestRun = await prisma.run.findFirst({
    where: {
      automationId,
      trigger: "scheduled",
      status: { not: "skipped" }
    },
    orderBy: { startedAt: "desc" }
  });

  if (!latestRun) return true;

  const elapsedMs = Date.now() - latestRun.startedAt.getTime();
  return elapsedMs >= intervalSeconds * 1000;
}

async function tick(): Promise<void> {
  const automations = await prisma.automation.findMany({
    where: {
      enabled: true,
      triggerType: "scheduled"
    }
  });

  for (const automation of automations) {
    if (inFlight.has(automation.id)) continue;

    const schedule = parseSchedule(automation.schedule);
    if (!schedule || !(await shouldRun(automation.id, schedule.intervalSeconds))) continue;

    inFlight.add(automation.id);
    void runAutomation(automation.id, "scheduled")
      .catch((error) => {
        console.error(`Scheduled automation ${automation.id} failed`, error);
      })
      .finally(() => {
        inFlight.delete(automation.id);
      });
  }
}

export function startScheduler(): () => void {
  if (timer) return () => undefined;

  void tick();
  timer = setInterval(() => {
    void tick();
  }, 15_000);

  return () => {
    if (timer) clearInterval(timer);
    timer = undefined;
  };
}
