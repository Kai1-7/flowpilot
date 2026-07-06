import { BadgeCheck, Box, FileWarning } from "lucide-react";
import type { TemplateDefinition, TemplateKey } from "@flowpilot/shared";

const riskIcon = {
  "read-only": BadgeCheck,
  "sandbox-write": FileWarning,
  webhook: Box
};

export function TemplateChoiceGrid({
  templates,
  selectedKey,
  onSelect
}: {
  templates: TemplateDefinition[];
  selectedKey: TemplateKey;
  onSelect: (templateKey: TemplateKey) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {templates.map((template) => {
        const Icon = riskIcon[template.riskLevel];
        const selected = template.key === selectedKey;

        return (
          <button
            key={template.key}
            type="button"
            onClick={() => onSelect(template.key)}
            className={`min-h-44 rounded-lg border p-4 text-left shadow-sm transition ${
              selected
                ? "border-cyan-400 bg-cyan-50 ring-2 ring-cyan-100"
                : "border-zinc-200 bg-white hover:border-cyan-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-zinc-500">{template.category}</div>
                <div className="mt-2 text-base font-bold text-zinc-950">{template.name}</div>
              </div>
              <div className="grid size-9 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
                <Icon size={17} />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{template.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-cyan-700 ring-1 ring-cyan-100">
                {template.defaultTriggerType}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-zinc-600 ring-1 ring-zinc-200">
                {template.riskLevel}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
