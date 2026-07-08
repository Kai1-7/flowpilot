import { AlertCircle, CheckCircle2, Clock3, FileText, TerminalSquare } from "lucide-react";
import { JsonBlock } from "./JsonBlock";
import type { Run } from "../lib/api";
import { formatDate, formatDuration } from "../lib/format";

function TimelineDot({ tone }: { tone: "info" | "success" | "error" | "artifact" }) {
  const className =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "error"
        ? "bg-rose-500"
        : tone === "artifact"
          ? "bg-violet-500"
          : "bg-cyan-500";

  return <span className={`mt-1 size-3 rounded-full ${className}`} />;
}

export function RunTimeline({ run }: { run: Run }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <TimelineDot tone="info" />
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <Clock3 size={15} />
            Run started
          </div>
          <div className="mt-1 text-xs text-zinc-500">{formatDate(run.startedAt)} via {run.trigger}</div>
        </div>
      </div>

      {run.logs?.map((log) => (
        <div key={log.id} className="flex gap-3">
          <TimelineDot tone={log.level === "error" ? "error" : "info"} />
          <div className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                <TerminalSquare size={15} />
                {log.message}
              </div>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold uppercase text-zinc-600">
                {log.level}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-500">{formatDate(log.createdAt)}</div>
            {log.data ? <div className="mt-3"><JsonBlock value={log.data} /></div> : null}
          </div>
        </div>
      ))}

      {run.artifacts?.map((artifact) => (
        <div key={artifact.id} className="flex gap-3">
          <TimelineDot tone="artifact" />
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <FileText size={15} />
              Artifact created
            </div>
            <div className="mt-1 text-xs text-zinc-500">{artifact.title}</div>
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <TimelineDot tone={run.status === "failed" ? "error" : "success"} />
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            {run.status === "failed" ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            Run {run.status}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {run.finishedAt ? formatDate(run.finishedAt) : "Not finished"} · {formatDuration(run.durationMs)}
          </div>
        </div>
      </div>
    </div>
  );
}
