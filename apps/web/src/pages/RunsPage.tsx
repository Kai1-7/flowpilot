import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { JsonBlock } from "../components/JsonBlock";
import { StatusPill } from "../components/StatusPill";
import { api } from "../lib/api";
import { formatDate, formatDuration } from "../lib/format";

export function RunsPage() {
  const { id } = useParams();
  const runsQuery = useQuery({
    queryKey: ["runs"],
    queryFn: api.runs
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
            <JsonBlock value={runQuery.data.run.output ?? {}} />
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-zinc-950">Logs</h3>
              {runQuery.data.run.logs?.map((log) => (
                <div key={log.id} className="rounded-lg border border-zinc-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-zinc-950">{log.message}</span>
                    <span className="text-xs uppercase text-zinc-500">{log.level}</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{formatDate(log.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
