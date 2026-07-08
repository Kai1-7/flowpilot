import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { runStatuses, triggerTypes, type RunFilterInput } from "@flowpilot/shared";
import { Link, useParams } from "react-router-dom";
import { FilterSelect, FilterToolbar } from "../components/FilterToolbar";
import { JsonBlock } from "../components/JsonBlock";
import { RunTimeline } from "../components/RunTimeline";
import { StatusPill } from "../components/StatusPill";
import { api } from "../lib/api";
import { formatDate, formatDuration } from "../lib/format";

export function RunsPage() {
  const { id } = useParams();
  const [filters, setFilters] = useState<RunFilterInput>({});
  const runsQuery = useQuery({
    queryKey: ["runs", filters],
    queryFn: () => api.runs(filters)
  });
  const runQuery = useQuery({
    queryKey: ["run", id],
    queryFn: () => api.run(id!),
    enabled: Boolean(id)
  });

  if (runsQuery.isLoading) return <div className="rounded-lg bg-white p-6 shadow-sm">Loading runs...</div>;
  if (runsQuery.error) return <div className="rounded-lg bg-rose-50 p-6 text-rose-700">{(runsQuery.error as Error).message}</div>;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <section className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950">Runs</h1>
          <p className="mt-1 text-sm text-zinc-600">Execution history with status, duration, and trigger source.</p>
        </div>
        <FilterToolbar
          search={filters.q ?? ""}
          onSearchChange={(q) => setFilters((current) => ({ ...current, q: q || undefined }))}
          onClear={() => setFilters({})}
        >
          <FilterSelect
            label="Status"
            value={filters.status ?? ""}
            onChange={(status) =>
              setFilters((current) => ({ ...current, status: (status || undefined) as RunFilterInput["status"] }))
            }
            options={[
              { label: "All", value: "" },
              ...runStatuses.map((status) => ({ label: status, value: status }))
            ]}
          />
          <FilterSelect
            label="Trigger"
            value={filters.trigger ?? ""}
            onChange={(trigger) =>
              setFilters((current) => ({ ...current, trigger: (trigger || undefined) as RunFilterInput["trigger"] }))
            }
            options={[
              { label: "All", value: "" },
              ...triggerTypes.map((trigger) => ({ label: trigger, value: trigger }))
            ]}
          />
        </FilterToolbar>
        <div className="text-sm text-zinc-600">
          Showing <span className="font-semibold text-zinc-950">{runsQuery.data?.runs.length ?? 0}</span> runs
        </div>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-normal text-zinc-500">
                <tr>
                  <th className="px-5 py-3">Automation</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Trigger</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Started</th>
                </tr>
              </thead>
              <tbody>
                {runsQuery.data?.runs.map((run) => (
                  <tr key={run.id} className="border-b border-zinc-100">
                    <td className="px-5 py-4">
                      <Link to={`/runs/${run.id}`} className="font-semibold text-zinc-950 hover:text-cyan-700">
                        {run.automation?.name ?? run.automationId}
                      </Link>
                    </td>
                    <td className="px-5 py-4"><StatusPill status={run.status} /></td>
                    <td className="px-5 py-4 text-zinc-600">{run.trigger}</td>
                    <td className="px-5 py-4 text-zinc-600">{formatDuration(run.durationMs)}</td>
                    <td className="px-5 py-4 text-zinc-600">{formatDate(run.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-zinc-950">Run detail</h2>
        {!id ? <div className="mt-4 text-sm text-zinc-500">Select a run from the table.</div> : null}
        {runQuery.isLoading ? <div className="mt-4 text-sm text-zinc-500">Loading selected run...</div> : null}
        {runQuery.data?.run ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <StatusPill status={runQuery.data.run.status} />
              <span className="text-xs text-zinc-500">{formatDuration(runQuery.data.run.durationMs)}</span>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-lg bg-zinc-50 p-3">
                <div className="text-xs font-semibold uppercase tracking-normal text-zinc-500">Attempt</div>
                <div className="mt-1 font-bold text-zinc-950">{runQuery.data.run.attempt}</div>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <div className="text-xs font-semibold uppercase tracking-normal text-zinc-500">Logs</div>
                <div className="mt-1 font-bold text-zinc-950">{runQuery.data.run.logs?.length ?? 0}</div>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <div className="text-xs font-semibold uppercase tracking-normal text-zinc-500">Artifacts</div>
                <div className="mt-1 font-bold text-zinc-950">{runQuery.data.run.artifacts?.length ?? 0}</div>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-zinc-950">Output</h3>
              <JsonBlock value={runQuery.data.run.output ?? {}} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-zinc-950">Timeline</h3>
              <RunTimeline run={runQuery.data.run} />
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
