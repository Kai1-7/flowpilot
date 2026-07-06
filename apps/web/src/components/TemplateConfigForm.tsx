import { getTemplateBuilderDefinition, type BuilderFieldDefinition } from "@flowpilot/shared";
import type { BuilderDraft } from "../lib/builder";
import { setDraftConfigValue } from "../lib/builder";

type Rule = {
  extensions: string[];
  targetDir: string;
};

function stringifyRuleExtensions(rule: Rule): string {
  return rule.extensions.join(", ");
}

function parseRuleExtensions(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function ConfigField({
  field,
  draft,
  onChange
}: {
  field: BuilderFieldDefinition;
  draft: BuilderDraft;
  onChange: (draft: BuilderDraft) => void;
}) {
  const value = draft.config[field.name];

  if (field.type === "boolean") {
    return (
      <label className="flex min-h-20 items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(setDraftConfigValue(draft, field.name, event.target.checked))}
          className="mt-1 size-4 rounded border-zinc-300 text-cyan-600"
        />
        <span>
          <span className="block text-sm font-semibold text-zinc-800">{field.label}</span>
          <span className="mt-1 block text-xs leading-5 text-zinc-500">{field.help}</span>
        </span>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="block">
        <span className="text-sm font-semibold text-zinc-700">{field.label}</span>
        <select
          value={String(value ?? "")}
          onChange={(event) => onChange(setDraftConfigValue(draft, field.name, event.target.value))}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs leading-5 text-zinc-500">{field.help}</span>
      </label>
    );
  }

  if (field.type === "rules") {
    const rules = Array.isArray(value) ? (value as Rule[]) : [];

    return (
      <div className="space-y-3">
        <div>
          <div className="text-sm font-semibold text-zinc-700">{field.label}</div>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{field.help}</p>
        </div>
        {rules.map((rule, index) => (
          <div key={`${rule.targetDir}-${index}`} className="grid gap-3 rounded-lg border border-zinc-200 p-3 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-normal text-zinc-500">Extensions</span>
              <input
                value={stringifyRuleExtensions(rule)}
                onChange={(event) => {
                  const next = rules.map((item, ruleIndex) =>
                    ruleIndex === index ? { ...item, extensions: parseRuleExtensions(event.target.value) } : item
                  );
                  onChange(setDraftConfigValue(draft, field.name, next));
                }}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-normal text-zinc-500">Target folder</span>
              <input
                value={rule.targetDir}
                onChange={(event) => {
                  const next = rules.map((item, ruleIndex) =>
                    ruleIndex === index ? { ...item, targetDir: event.target.value } : item
                  );
                  onChange(setDraftConfigValue(draft, field.name, next));
                }}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
            </label>
          </div>
        ))}
      </div>
    );
  }

  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-700">{field.label}</span>
      <input
        type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
        min={field.min}
        max={field.max}
        step={field.step}
        placeholder={field.placeholder}
        value={String(value ?? "")}
        onChange={(event) => {
          const nextValue = field.type === "number" ? Number(event.target.value) : event.target.value;
          onChange(setDraftConfigValue(draft, field.name, nextValue));
        }}
        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
      />
      <span className="mt-1 block text-xs leading-5 text-zinc-500">{field.help}</span>
    </label>
  );
}

export function TemplateConfigForm({
  draft,
  onChange
}: {
  draft: BuilderDraft;
  onChange: (draft: BuilderDraft) => void;
}) {
  const builder = getTemplateBuilderDefinition(draft.templateKey);

  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-bold text-zinc-950">Template configuration</h2>
        <p className="mt-1 text-sm text-zinc-600">{builder.successHint}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {builder.configFields.map((field) => (
          <ConfigField key={field.name} field={field} draft={draft} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}
