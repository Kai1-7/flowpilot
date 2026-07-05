import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Link2, Play, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { JsonBlock } from "../components/JsonBlock";
import { StatusPill } from "../components/StatusPill";
import { api } from "../lib/api";
import { formatDate, formatDuration } from "../lib/format";

export function AutomationDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["automation", id],
    queryFn: () => api.automation(id!),
    enabled: Boolean(id)
  });
  const runMutation = useMutation({
    mutationFn: () => api.runAutomation(id!),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["automation", id] }),
        queryClient.invalidateQueries({ queryKey: ["runs"] }),
        queryClient.invalidateQueries({ queryKey: ["artifacts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      ]);
    }
  });

  if (isLoading) return <div className="rounded-lg bg-white p-6 shadow-sm">Loading automation...</div>;
  if (error) return <div className="rounded-lg bg-rose-50 p-6 text-rose-700">{(error as Error).message}</div>;
  if (!data) return null;

  const automation = data.automation;
  const webhookUrl = automation.webhookSlug ? `/api/webhooks/${automation.webhookSlug}` : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Link to="/automations" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-950">
            <ArrowLeft size={16} />
            Automations
          </Link>
          <h1 className="text-2xl font-bold text-zinc-950">{automation.name}</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600">{automation.description}</p>
        </div>
        <button
          type="button"
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {runMutation.isPending ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
          Run now
        </button>
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-zinc-950">Configuration</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Template</dt>
                <dd className="font-medium text-zinc-950">{automation.templateKey}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Trigger</dt>
                <dd className="font-medium text-zinc-950">{automation.triggerType}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Retries</dt>
                <dd className="font-medium text-zinc-950">{automation.retryLimit}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Enabled</dt>
                <dd className="font-medium text-zinc-950">{automation.enabled ? "yes" : "no"}</dd>
              </div>
            </dl>
            {webhookUrl ? (
              <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <Link2 size={15} />
                  Webhook
                </div>
                <code className="break-all text-xs">{webhookUrl}</code>
              </div>
            ) : null}
          </div>
          <JsonBlock value={automation.config} />
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-zinc-950">Run history</h2>
          <div className="mt-4 space-y-3">
            {automation.runs?.map((run) => (
              <Link
                key={run.id}
                to={`/runs/${run.id}`}
                className="block rounded-lg border border-zinc-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <StatusPill status={run.status} />
                  <span className="text-xs text-zinc-500">{formatDate(run.startedAt)}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-3">
                  <span>Trigger: {run.trigger}</span>
                  <span>Attempt: {run.attempt}</span>
                  <span>Duration: {formatDuration(run.durationMs)}</span>
                </div>
              </Link>
            ))}
            {!automation.runs?.length ? <div className="text-sm text-zinc-500">No runs recorded.</div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
