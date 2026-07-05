import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";

export function ArtifactPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["artifacts"],
    queryFn: api.artifacts
  });

  if (isLoading) return <div className="rounded-lg bg-white p-6 shadow-sm">Loading artifacts...</div>;
  if (error) return <div className="rounded-lg bg-rose-50 p-6 text-rose-700">{(error as Error).message}</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-950">Artifacts</h1>
        <p className="mt-1 text-sm text-zinc-600">Markdown outputs produced by automation runs.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {data?.artifacts.map((artifact) => (
          <article key={artifact.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                  <FileText size={16} className="text-cyan-700" />
                  {artifact.title}
                </div>
                <div className="mt-1 text-xs text-zinc-500">{formatDate(artifact.createdAt)}</div>
              </div>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">{artifact.type}</span>
            </div>
            <div className="mt-4 rounded-lg bg-zinc-50 p-4">
              <pre className="max-h-52 overflow-auto whitespace-pre-wrap text-xs leading-5 text-zinc-700">
                {artifact.content ?? "No preview available."}
              </pre>
            </div>
            {artifact.path ? <div className="mt-3 text-xs text-zinc-500">{artifact.path}</div> : null}
          </article>
        ))}
        {!data?.artifacts.length ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">
            No artifacts yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
