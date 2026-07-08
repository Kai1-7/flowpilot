import { runStatuses, triggerTypes, type DashboardHealthSummary, type RunStatus, type TriggerType } from "@flowpilot/shared";
import { prisma } from "../db.js";

type CountRow = {
  _count: { _all: number };
};

function ensureStatusCounts(rows: Array<{ status: string } & CountRow>) {
  return runStatuses.map((status) => ({
    status,
    count: rows.find((row) => row.status === status)?._count._all ?? 0
  }));
}

function ensureTriggerCounts(rows: Array<{ trigger: string } & CountRow>) {
  return triggerTypes.map((trigger) => ({
    trigger,
    count: rows.find((row) => row.trigger === trigger)?._count._all ?? 0
  }));
}

export async function getDashboardHealthSummary(): Promise<DashboardHealthSummary> {
  const [runCount, successCount, durationAggregate, latestRun, statusRows, triggerRows] = await prisma.$transaction([
    prisma.run.count(),
    prisma.run.count({ where: { status: "success" } }),
    prisma.run.aggregate({
      _avg: { durationMs: true },
      where: { durationMs: { not: null } }
    }),
    prisma.run.findFirst({
      orderBy: { startedAt: "desc" },
      select: { startedAt: true }
    }),
    prisma.run.groupBy({
      by: ["status"],
      orderBy: { status: "asc" },
      _count: { _all: true }
    }),
    prisma.run.groupBy({
      by: ["trigger"],
      orderBy: { trigger: "asc" },
      _count: { _all: true }
    })
  ]);

  return {
    successRate: runCount === 0 ? 0 : Math.round((successCount / runCount) * 100),
    averageDurationMs:
      durationAggregate._avg.durationMs === null ? null : Math.round(durationAggregate._avg.durationMs),
    lastRunAt: latestRun?.startedAt.toISOString() ?? null,
    statusCounts: ensureStatusCounts(statusRows as Array<{ status: RunStatus } & CountRow>),
    triggerCounts: ensureTriggerCounts(triggerRows as Array<{ trigger: TriggerType } & CountRow>)
  };
}
