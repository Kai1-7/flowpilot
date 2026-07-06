import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Box, FileWarning, Settings } from "lucide-react";
import type { TemplateDefinition } from "@flowpilot/shared";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

const riskIcon = {
  "read-only": BadgeCheck,
  "sandbox-write": FileWarning,
  webhook: Box
};

function TemplateCard({ template }: { template: TemplateDefinition }) {
  const Icon = riskIcon[template.riskLevel];

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-normal text-zinc-500">{template.category}</div>
          <h2 className="mt-2 text-lg font-bold text-zinc-950">{template.name}</h2>
        </div>
        <div className="grid size-10 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-600">{template.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700">{template.defaultTriggerType}</span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-semibold text-zinc-600">{template.riskLevel}</span>
      </div>
      <Link
        to={`/automations/new?template=${template.key}`}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        <Settings size={16} />
        Configure automation
      </Link>
    </article>
  );
}

export function TemplatesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["templates"],
    queryFn: api.templates
  });

  if (isLoading) return <div className="rounded-lg bg-white p-6 shadow-sm">Loading templates...</div>;
  if (error) return <div className="rounded-lg bg-rose-50 p-6 text-rose-700">{(error as Error).message}</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-950">Templates</h1>
        <p className="mt-1 text-sm text-zinc-600">Reusable workflow starters with validated configuration.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data?.templates.map((template) => <TemplateCard key={template.key} template={template} />)}
      </div>
    </div>
  );
}
