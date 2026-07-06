import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, FileText, Play, ShieldCheck, Workflow, XCircle } from "lucide-react";
import type { TemplateDefinition } from "@flowpilot/shared";
import { Link } from "react-router-dom";
import { MetricCard } from "../components/MetricCard";
import { StatusPill } from "../components/StatusPill";
import { api } from "../lib/api";
import { formatDate, formatDuration } from "../lib/format";

function RunSparkline({ success, failed }: { success: number; failed: number }) {
  const total = Math.max(1, success + failed);
  const successHeight = Math.max(14, Math.round((success / total) * 64));
  const failedHeight = Math.max(10, Math.round((failed / total) * 64));

  return (
    <div className="flex h-20 items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="run-bar w-10 rounded-t-md bg-emerald-400" style={{ height: successHeight }} />
      <div className="run-bar w-10 rounded-t-md bg-rose-300" style={{ height: failedHeight }} />
      <div className="ml-2 text-sm text-zinc-600">
        <div className="font-semibold text-zinc-900">{Math.round((success / total) * 100)}% success</div>
        <div>{success} passed, {failed} failed</div>
      </div>
    </div>
  );
}

function TemplateStarter({ template }: { template: TemplateDefinition }) {
  return (
    <Link
      to={`/automations/new?template=${template.key}`}
      className="flex min-h-24 w-full flex-col justify-between rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-panel"
    >
      <div>
        <div className="text-sm font-bold text-zinc-950">{template.name}</div>
        <div className="mt-1 text-xs leading-5 text-zinc-500">{template.category}</div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-cyan-700">
        <Play size={14} />
        Configure starter
      </div>
    </Link>
  );
}

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard
  });

  if (isLoading) return <div className="rounded-lg bg-white p-6 shadow-sm">Loading dashboard...</div>;
  if (error) return <div className="rounded-lg bg-rose-50 p-6 text-rose-700">{(error as Error).message}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">Automation health, recent activity, and starter workflows.</p>
        </div>
        <Link
          to="/automations"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
        >
          <Workflow size={16} />
          Open automations
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Automations" value={data.automationCount} icon={<Workflow size={19} />} tone="bg-cyan-100 text-cyan-700" />
        <MetricCard label="Enabled" value={data.enabledAutomationCount} icon={<ShieldCheck size={19} />} tone="bg-emerald-100 text-emerald-700" />
        <MetricCard label="Runs" value={data.runCount} icon={<Activity size={19} />} tone="bg-amber-100 text-amber-700" />
        <MetricCard label="Artifacts" value={data.artifactCount} icon={<FileText size={19} />} tone="bg-violet-100 text-violet-700" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-zinc-950">Recent runs</h2>
            <Link to="/runs" className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase tracking-normal text-zinc-500">
                <tr className="border-b border-zinc-200">
                  <th className="py-2 pr-4">Automation</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Trigger</th>
                  <th className="py-2 pr-4">Duration</th>
                  <th className="py-2">Started</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRuns.map((run) => (
                  <tr key={run.id} className="border-b border-zinc-100">
                    <td className="py-3 pr-4 font-medium text-zinc-950">{run.automation?.name ?? "Unknown"}</td>
                    <td className="py-3 pr-4"><StatusPill status={run.status} /></td>
                    <td className="py-3 pr-4 text-zinc-600">{run.trigger}</td>
                    <td className="py-3 pr-4 text-zinc-600">{formatDuration(run.durationMs)}</td>
                    <td className="py-3 text-zinc-600">{formatDate(run.startedAt)}</td>
                  </tr>
                ))}
                {!data.recentRuns.length && (
                  <tr>
                    <td className="py-6 text-zinc-500" colSpan={5}>No runs yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <RunSparkline success={data.successCount} failed={data.failedCount} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                <CheckCircle2 size={17} />
                Successful runs
              </div>
              <div className="mt-2 text-2xl font-bold text-zinc-950">{data.successCount}</div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-700">
                <XCircle size={17} />
                Failed runs
              </div>
              <div className="mt-2 text-2xl font-bold text-zinc-950">{data.failedCount}</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-950">Template starters</h2>
          <Link to="/templates" className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">Browse templates</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.templates.map((template) => (
            <TemplateStarter key={template.key} template={template} />
          ))}
        </div>
      </section>
    </div>
  );
}
