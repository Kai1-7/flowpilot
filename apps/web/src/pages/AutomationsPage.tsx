import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Play, Power, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusPill } from "../components/StatusPill";
import { api, type Automation } from "../lib/api";
import { formatDate, formatDuration } from "../lib/format";

function AutomationRow({ automation }: { automation: Automation }) {
  const queryClient = useQueryClient();
  const runMutation = useMutation({
    mutationFn: () => api.runAutomation(automation.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["automations"] }),
        queryClient.invalidateQueries({ queryKey: ["runs"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      ]);
    }
  });
  const toggleMutation = useMutation({
    mutationFn: () => api.toggleAutomation(automation.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["automations"] });
    }
  });

  const latestRun = automation.runs?.[0];

  return (
    <tr className="border-b border-zinc-100 align-top">
      <td className="py-4 pr-4">
        <div className="font-semibold text-zinc-950">{automation.name}</div>
        <div className="mt-1 max-w-xl text-xs leading-5 text-zinc-500">{automation.description}</div>
      </td>
      <td className="py-4 pr-4 text-sm text-zinc-600">{automation.templateKey}</td>
      <td className="py-4 pr-4 text-sm text-zinc-600">{automation.triggerType}</td>
      <td className="py-4 pr-4">
        {latestRun ? <StatusPill status={latestRun.status} /> : <span className="text-sm text-zinc-400">No runs</span>}
        {latestRun ? <div className="mt-2 text-xs text-zinc-500">{formatDuration(latestRun.durationMs)}</div> : null}
      </td>
      <td className="py-4 pr-4 text-sm text-zinc-600">{formatDate(automation.updatedAt)}</td>
      <td className="py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            className="grid size-9 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-50"
            title="Run automation"
          >
            {runMutation.isPending ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
          </button>
          <button
            type="button"
            onClick={() => toggleMutation.mutate()}
            className={`grid size-9 place-items-center rounded-lg border ${
              automation.enabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-zinc-100 text-zinc-500"
            }`}
            title={automation.enabled ? "Disable automation" : "Enable automation"}
          >
            <Power size={16} />
          </button>
          <Link
            to={`/automations/${automation.id}`}
            className="grid size-9 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
            title="Open details"
          >
            <Eye size={16} />
          </Link>
        </div>
      </td>
    </tr>
  );
}

export function AutomationsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["automations"],
    queryFn: api.automations
  });

  if (isLoading) return <div className="rounded-lg bg-white p-6 shadow-sm">Loading automations...</div>;
  if (error) return <div className="rounded-lg bg-rose-50 p-6 text-rose-700">{(error as Error).message}</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950">Automations</h1>
          <p className="mt-1 text-sm text-zinc-600">Enabled workflows, latest run state, and execution controls.</p>
        </div>
        <Link
          to="/templates"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          New from template
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-zinc-50 text-xs uppercase tracking-normal text-zinc-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Template</th>
                <th className="px-5 py-3">Trigger</th>
                <th className="px-5 py-3">Latest</th>
                <th className="px-5 py-3">Updated</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.automations.map((automation) => (
                <AutomationRow key={automation.id} automation={automation} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
